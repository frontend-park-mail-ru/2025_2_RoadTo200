import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { menu } from './menu';
import type { Store } from '../../Dispatcher';
import ProfileApi from '@/apiHandler/profileApi';

class MenuStore implements Store {
    private currentRoute = 'main';
    private menuComponent = menu;
    private isPremiumUser: boolean | null = null;

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

            default:
                break;
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
        };

        await this.menuComponent.render(menuData);
    }
}

export default new MenuStore();
