import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { profileMenu } from './profileMenu';
import AuthApi from '../../apiHandler/authApi';
import type { Store } from '../../Dispatcher';

interface User {
    name?: string;
    email?: string;
    [key: string]: unknown;
}

class ProfileMenuStore implements Store {
    private user: User | null = null;
    private isVisible = false;
    private profileMenuComponent = profileMenu;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_PROFILE_MENU:
                await this.renderProfileMenu();
                break;

            case Actions.TOGGLE_PROFILE_MENU:
                await this.toggleMenu(
                    (action.payload as { isVisible?: boolean } | undefined)
                        ?.isVisible
                );
                break;

            case Actions.AUTH_STATE_UPDATED:
                this.user =
                    (action.payload as { user?: User | null } | undefined)
                        ?.user || null;
                if (this.isVisible) {
                    await this.renderProfileMenu();
                }
                break;

            default:
                break;
        }
    }

    private async renderProfileMenu(): Promise<void> {
        if (!this.user) {
            try {
                const response = await AuthApi.checkAuth();
                this.user = (response.user as User | null) || null;
            } catch (error) {
                this.user = null;
            }
        }

        const menuData = {
            user: this.user,
            isVisible: this.isVisible,
        };

        await this.profileMenuComponent.render(menuData);
    }

    private async toggleMenu(visible?: boolean): Promise<void> {
        const shouldBeVisible =
            visible !== undefined ? visible : !this.isVisible;

        if (shouldBeVisible && !this.user) {
            try {
                const response = await AuthApi.checkAuth();
                this.user = (response.user as User | null) || null;
            } catch (error) {
                this.user = null;
            }
            await this.renderProfileMenu();
        }

        this.isVisible = shouldBeVisible;
        this.profileMenuComponent.toggle(this.isVisible);
    }
}

export default new ProfileMenuStore();
