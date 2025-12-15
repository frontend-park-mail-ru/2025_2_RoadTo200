import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { notificationPopup, type Notification } from './notificationPopup';
import type { Store } from '../../Dispatcher';
import notificationApi from '../../apiHandler/notificationApi';
import notificationSocketService from '../../services/notificationSocket';
import type { NotificationSocketEvent, NotificationDTO } from '../../types/notification';
import profileApi from '../../apiHandler/profileApi';

class NotificationPopupStore implements Store {
    private isVisible = false;
    private notifications: Notification[] = [];
    private notificationComponent = notificationPopup;
    private renderScheduled = false;
    private lastData: { isVisible: boolean; length: number } | null = null;
    private hasLoadedOnce = false;

    constructor() {
        dispatcher.register(this);
        this.initializeNotifications();
        this.connectWebSocket();
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.TOGGLE_NOTIFICATION_POPUP:
                await this.togglePopup(action.payload as { isVisible: boolean });
                break;

            case Actions.ADD_NOTIFICATION:
                await this.addNotification(action.payload as Notification);
                break;

            case Actions.MARK_NOTIFICATION_READ:
                await this.markAsRead(action.payload as { id: string });
                break;

            case Actions.LOAD_NOTIFICATIONS:
                await this.loadNotifications('dispatcher');
                break;

            case Actions.NOTIFICATION_SOCKET_MESSAGE:
                await this.handleSocketMessage(action.payload as NotificationSocketEvent);
                break;

            case Actions.NOTIFICATION_SOCKET_STATUS:
                await this.handleSocketStatus(action.payload as { status: string });
                break;

            default:
                break;
        }
    }

    private async togglePopup(payload: { isVisible: boolean }): Promise<void> {
        this.isVisible = payload.isVisible;

        if (this.isVisible && !this.hasLoadedOnce) {
            await this.loadNotifications('togglePopup');
        }

        this.scheduleRender();
    }

    private async addNotification(notification: Notification): Promise<void> {
        if (this.notifications.some(n => n.id === notification.id)) {
            return;
        }
        this.notifications.unshift(notification);
        await this.doRender();
    }

    private async markAsRead(payload: { id: string }): Promise<void> {
        const notification = this.notifications.find(n => n.id === payload.id);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            await this.doRender();
            try {
                await notificationApi.markAsRead(payload.id);
            } catch (error) {
                notification.isRead = false;
                await this.doRender();
            }
        }
    }

    private async loadNotifications(source: string): Promise<void> {
        try {
            const response = await notificationApi.getNotifications();
            const filteredNotifications = (response.notifications || []).filter(n => n.type !== 'message');
            this.notifications = await this.convertDTOsToNotifications(filteredNotifications);
            this.hasLoadedOnce = true;
            this.scheduleRender();
        } catch (error) {
            this.notifications = [];
            this.scheduleRender();
        }
    }

    private initializeNotifications(): void {
        dispatcher.process({
            type: Actions.LOAD_NOTIFICATIONS,
        });
    }

    private connectWebSocket(): void {
        notificationSocketService.connect();
    }

    private async handleSocketMessage(event: NotificationSocketEvent): Promise<void> {

        switch (event.type) {
            case 'notification':
                if (event.id && event.notif_type && event.created_at) {
                    if (event.notif_type === 'message') return;
                    const userName = event.from_user_id ? await this.fetchUserName(event.from_user_id) : undefined;
                    const newNotification: Notification = {
                        id: event.id,
                        message: this.generateMessageByType(event.notif_type, userName),
                        time: this.formatTime(event.created_at),
                        isRead: event.is_read || false,
                        isMatch: event.notif_type === 'like' || event.notif_type === 'super_like' || event.notif_type === 'match',
                        type: event.notif_type,
                        user_name: userName,
                        from_user_id: event.from_user_id,
                    };
                    await this.addNotification(newNotification);
                }
                else if (event.notification) {
                    const dto = event.notification;
                    if (dto.type === 'message') return;
                    const userName = dto.from_user_id ? await this.fetchUserName(dto.from_user_id) : undefined;
                    const newNotification: Notification = {
                        id: dto.id,
                        message: this.generateMessage(dto, userName),
                        time: this.formatTime(dto.created_at),
                        isRead: dto.is_read,
                        isMatch: dto.type === 'like' || dto.type === 'super_like' || dto.type === 'match',
                        type: dto.type,
                        user_name: userName,
                        from_user_id: dto.from_user_id,
                    };
                    await this.addNotification(newNotification);
                }
                break;

            case 'error':
                break;

            default:
                break;
        }
    }

    private async handleSocketStatus(payload: { status: string }): Promise<void> {
        if (payload.status === 'connected' && !this.hasLoadedOnce) {
            await this.loadNotifications('socketStatus');
        }
    }

    private async convertDTOsToNotifications(dtos: NotificationDTO[]): Promise<Notification[]> {
        const notifications = await Promise.all(dtos.map(async (dto) => {
            const userName = dto.from_user_id ? await this.fetchUserName(dto.from_user_id) : undefined;
            return {
                id: dto.id,
                message: this.generateMessage(dto, userName),
                time: this.formatTime(dto.created_at),
                isRead: dto.is_read,
                isMatch: dto.type === 'like' || dto.type === 'super_like' || dto.type === 'match',
                type: dto.type,
                user_name: userName,
                from_user_id: dto.from_user_id,
            };
        }));
        return notifications;
    }

    private async fetchUserName(userId: string): Promise<string | undefined> {
        try {
            const profile = await profileApi.getProfileById(userId);

            return profile.user.name;
        } catch (error) {

            return undefined;
        }
    }

    private generateMessage(dto: NotificationDTO, userName?: string): string {
        return this.generateMessageByType(dto.type, userName);
    }

    private generateMessageByType(type: 'like' | 'super_like' | 'message' | 'match', userName?: string): string {
        const name = userName || 'Пользователь';
        const styledName = `<span class="notification-user-name">${name}</span>`;
        switch (type) {
            case 'like':
                return `${styledName} поставил лайк!`;
            case 'message':
                return `Новое сообщение от ${styledName}`;
            case 'super_like':
                return `${styledName} поставил супер-лайк!`;
            case 'match':
                return `У вас новый мэтч с ${styledName}!`;
            default:
                return 'Новое уведомление';
        }
    }


    private formatTime(isoString: string): string {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'только что';
        } else if (diffMins < 60) {
            return `${diffMins} мин назад`;
        } else if (diffHours < 24) {
            return `${diffHours} час${diffHours > 1 ? 'а' : ''} назад`;
        } else if (diffDays < 7) {
            return `${diffDays} дн${diffDays > 1 ? 'я' : 'ь'} назад`;
        } else {
            return date.toLocaleDateString('ru-RU');
        }
    }

    private scheduleRender(): void {
        if (this.renderScheduled) return;
        this.renderScheduled = true;

        Promise.resolve().then(() => {
            this.renderScheduled = false;
            this.doRender();
        });
    }

    private async doRender(): Promise<void> {
        const data = {
            isVisible: this.isVisible,
            notifications: this.notifications,
        };


        await this.notificationComponent.render(data);
    }
}

export const notificationPopupStore = new NotificationPopupStore();
