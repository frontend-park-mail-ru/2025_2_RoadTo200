import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { notificationPopup, Notification } from './notificationPopup';
import type { Store } from '../../Dispatcher';

class NotificationPopupStore implements Store {
    private isVisible = false;
    private notifications: Notification[] = [];
    private notificationComponent = notificationPopup;

    constructor() {
        dispatcher.register(this);
        this.loadMockNotifications();
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

            default:
                break;
        }
    }

    private async togglePopup(payload: { isVisible: boolean }): Promise<void> {
        this.isVisible = payload.isVisible;
        await this.render();
    }

    private async addNotification(notification: Notification): Promise<void> {
        this.notifications.unshift(notification);
        await this.render();
    }

    private async markAsRead(payload: { id: string }): Promise<void> {
        const notification = this.notifications.find(n => n.id === payload.id);
        if (notification) {
            notification.isRead = true;
            await this.render();
        }
    }

    private async render(): Promise<void> {
        if (!this.notificationComponent.parent || !document.body.contains(this.notificationComponent.parent)) {
            const parent = document.querySelector<HTMLElement>('#notificationPopup-root');
            if (parent) {
                this.notificationComponent.parent = parent;
            }
        }
        
        await this.notificationComponent.render({
            isVisible: this.isVisible,
            notifications: this.notifications,
        });
    }

    private loadMockNotifications(): void {
        this.notifications = [
            {
                id: '1',
                message: 'У вас новый мэтч!',
                time: '5 мин назад',
                isRead: false,
                isMatch: true,
            },
            {
                id: '2',
                message: 'Новое сообщение от Анны',
                time: '1 час назад',
                isRead: false,
                isMatch: false,
            },
            {
                id: '3',
                message: 'Ваш профиль был просмотрен',
                time: '3 часа назад',
                isRead: true,
                isMatch: false,
            },
            {
                id: '1',
                message: 'У вас новый мэтч!',
                time: '5 мин назад',
                isRead: false,
                isMatch: true,
            },
            {
                id: '2',
                message: 'Новое сообщение от Анны',
                time: '1 час назад',
                isRead: false,
                isMatch: false,
            },
            {
                id: '3',
                message: 'Ваш профиль был просмотрен',
                time: '3 часа назад',
                isRead: true,
                isMatch: false,
            },
        ];
    }
}

export const notificationPopupStore = new NotificationPopupStore();
