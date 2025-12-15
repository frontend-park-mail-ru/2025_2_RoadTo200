import Handlebars from 'handlebars';

Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

import { dispatcher } from '../../Dispatcher';
import { Actions } from '../../actions';
import './notificationPopup.scss';

const TEMPLATE_PATH = '/src/components/NotificationPopup/notificationPopup.hbs';

export interface Notification {
    id: string;
    message: string;
    time: string;
    isRead: boolean;
    type?: 'like' | 'super_like' | 'message' | 'match';
    isMatch?: boolean;
    user_name?: string;
    from_user_id?: string;
}

interface NotificationPopupData {
    isVisible: boolean;
    notifications: Notification[];
}

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон уведомлений');
        }
        return await response.text();
    } catch (error) {

        return '<div></div>';
    }
};

export class NotificationPopup {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: NotificationPopupData): Promise<void> {
        if (!this.parent || !document.body.contains(this.parent)) {
            const parent = document.querySelector<HTMLElement>('#notificationPopup-root');
            if (!parent) {
                return;
            }
            this.parent = parent;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template(data);
        this.parent.innerHTML = renderedHtml;

        if (data.isVisible) {
            this.initEventListeners();
        }
    }

    private initEventListeners(): void {
        if (typeof window === 'undefined' || !this.parent) return;

        const overlay = this.parent.querySelector('#notificationMenuOverlay');
        const popup = this.parent.querySelector('.notification-menu-popup');

        if (!overlay || !popup) return;

        overlay.addEventListener('click', (e: Event) => {
            if (e.target === overlay) {
                dispatcher.process({
                    type: Actions.TOGGLE_NOTIFICATION_POPUP,
                    payload: { isVisible: false },
                });
            }
        });

        popup.addEventListener('click', (e: Event) => {
            e.stopPropagation();
        });

        const notificationItems = this.parent.querySelectorAll('.notification-item');
        notificationItems.forEach(item => {
            item.addEventListener('click', (e: Event) => {
                const target = e.currentTarget as HTMLElement;
                const userId = target.dataset.userId;
                const notificationId = target.dataset.id;
                const notificationType = target.dataset.type;
                if (userId) {
                    if (notificationId) {
                        dispatcher.process({
                            type: Actions.MARK_NOTIFICATION_READ,
                            payload: { id: notificationId, type: notificationType },
                        });
                    }
                    dispatcher.process({
                        type: Actions.TOGGLE_NOTIFICATION_POPUP,
                        payload: { isVisible: false },
                    });
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: `/profile/${userId}` },
                    });
                }
            });
        });
    }
}

export const notificationPopup = new NotificationPopup(null);
