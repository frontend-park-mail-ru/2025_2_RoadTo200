import { dispatcher } from '../../Dispatcher';
import type { Store } from '../../Dispatcher';
import { Actions, type Action } from '../../actions';
import { settingsMenu } from './settingsMenu';

class SettingsMenuStore implements Store {
    private currentTab: string;
    private settingsMenuComponent: typeof settingsMenu;

    constructor() {
        this.currentTab = 'profile';

        dispatcher.register(this);
        this.settingsMenuComponent = settingsMenu;
    }

    async handleAction(action: Action): Promise<void> {
        const payload = action.payload as { tab?: string } | undefined;

        switch (action.type) {
            case Actions.RENDER_SETTINGS_MENU:
                if (payload?.tab) {
                    this.currentTab = payload.tab;
                } else {
                    this.currentTab = 'profile';
                }
                await this.renderSettingsMenu();
                break;

            case Actions.SWITCH_SETTINGS_TAB:
                if (payload?.tab) {
                    this.currentTab = payload.tab;
                }
                await this.renderSettingsMenu();
                break;

            default:
                break;
        }
    }

    private async renderSettingsMenu(): Promise<void> {
        const menuContainer = document.querySelector(
            '#settingsMenuContainer'
        ) as HTMLElement;
        if (menuContainer) {
            this.settingsMenuComponent.parent = menuContainer;

            const menuData = {
                currentTab: this.currentTab,
            };

            await this.settingsMenuComponent.render(menuData);
        }
    }
}

export default new SettingsMenuStore();
