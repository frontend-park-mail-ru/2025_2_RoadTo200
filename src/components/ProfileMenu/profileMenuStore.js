import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import { profileMenu } from './profileMenu.js';
import AuthApi from '../../apiHandler/authApi.js';

class ProfileMenuStore {
    user;

    isVisible;

    profileMenuComponent;

    constructor() {
        this.user = null;
        this.isVisible = false;
        
        dispatcher.register(this);
        this.profileMenuComponent = profileMenu;
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_PROFILE_MENU:
                await this.renderProfileMenu();
                break;

            case Actions.TOGGLE_PROFILE_MENU:
                await this.toggleMenu(action.payload?.isVisible);
                break;

            case Actions.AUTH_STATE_UPDATED:
                this.user = action.payload?.user || null;
                if (this.isVisible) {
                    await this.renderProfileMenu();
                }
                break;

            default:
                break;
        }
    }

    async renderProfileMenu() {
        if (!this.user) {
            try {
                const response = await AuthApi.checkAuth();
                this.user = response.user || null;
            } catch (error) {
                this.user = null;
            }
        }

        const menuData = {
            user: this.user,
            isVisible: this.isVisible
        };

        await this.profileMenuComponent.render(menuData);
    }

    async toggleMenu(visible) {
        const shouldBeVisible = visible !== undefined ? visible : !this.isVisible;
        
        if (shouldBeVisible && !this.user) {
            try {
                const response = await AuthApi.checkAuth();
                this.user = response.user || null;
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
