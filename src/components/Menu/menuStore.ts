import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { menu } from './menu';
import type { Store } from '../../Dispatcher';
import ProfileApi from '@/apiHandler/profileApi';
import notificationApi from '@/apiHandler/notificationApi';

class MenuStore implements Store {
    private currentRoute = 'main';
    private menuComponent = menu;
    private isPremiumUser: boolean | null = null;
    private chatsBadge: number = 0;
    private matchesBadge: number = 0;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MENU:
                if (
                    action.payload &&
                    (action.payload as { route?: string }).route
                ) {
                    this.currentRoute = (
                        action.payload as { route: string }
                    ).route;
                } else if (typeof window !== 'undefined') {
                    const path = window.location.pathname || '/';
                    this.currentRoute =
                        path === '/'
                            ? 'main'
                            : path.replace(/^\//, '').split('/')[0];
                }
                await this.renderMenu();
                break;
            case Actions.AUTH_STATE_UPDATED:
                this.isPremiumUser = Boolean(
                    (action.payload as { user?: { is_premium?: boolean } })
                        ?.user?.is_premium
                );
                await this.renderMenu();
                break;
            case Actions.LOAD_NOTIFICATIONS:
            case Actions.NOTIFICATION_SOCKET_MESSAGE:
                await this.updateBadgeCounts();
                await this.renderMenu();
                break;

            case Actions.MARK_NOTIFICATION_READ:
                const payload = action.payload as { id: string; type?: string };
                if (payload.type === 'message' && this.chatsBadge > 0) {
                    this.chatsBadge--;
                } else if (payload.type === 'match' && this.matchesBadge > 0) {
                    this.matchesBadge--;
                }
                await this.renderMenu();
                break;

            default:
                break;
        }
    }

    private async updateBadgeCounts(): Promise<void> {
        try {
            const response = await notificationApi.getNotifications();
            const unreadNotifications = response.notifications.filter(n => !n.is_read);
            
            this.chatsBadge = unreadNotifications.filter(n => n.type === 'message').length;
            this.matchesBadge = unreadNotifications.filter(n => n.type === 'match').length;
        } catch (error) {
            console.error('Error updating badge counts:', error);
        }
    }

    private async renderMenu(): Promise<void> {
        try {
            const profile = await ProfileApi.getProfile();
            this.isPremiumUser = Boolean(profile.user?.is_premium);
        } catch {
            if (this.isPremiumUser === null) {
                this.isPremiumUser = false;
            }
        }

        const menuData = {
            currentRoute: this.currentRoute,
            hidePremiumCta: this.isPremiumUser === true,
            chatsBadge: this.chatsBadge || undefined,
            matchesBadge: this.matchesBadge || undefined,
        };

        await this.menuComponent.render(menuData);
    }
}

export default new MenuStore();
