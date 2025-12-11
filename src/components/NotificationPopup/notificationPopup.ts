import { dispatcher } from '../../Dispatcher';
import { Actions } from '../../actions';
import './notificationPopup.scss';

const TEMPLATE_PATH = '/src/components/NotificationPopup/notificationPopup.hbs';

export interface Notification {
    id: string;
    message: string;
    time: string;
    isRead: boolean;
    isMatch?: boolean;
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
        console.error('Ошибка загрузки notificationPopup:', error);
        return '<div></div>';
    }
};

export class NotificationPopup {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: NotificationPopupData): Promise<void> {
        if (!this.parent) return;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template(data);

        this.parent.innerHTML = renderedHtml;

        if (data.isVisible) {
            this.initEventListeners();
        }
    }

    private initEventListeners(): void {
        if (typeof window !== 'undefined' && this.parent) {
            const overlay = this.parent.querySelector('#notificationMenuOverlay');
            const popup = this.parent.querySelector('.notification-menu-popup');

            if (overlay && popup) {
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
            }
        }
    }
}

export const notificationPopup = new NotificationPopup(null);
