import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import { settingsMenu } from './settingsMenu.js';

class SettingsMenuStore {
    currentTab;

    settingsMenuComponent;

    constructor() {
        this.currentTab = 'profile';
        
        dispatcher.register(this);
        this.settingsMenuComponent = settingsMenu;
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_SETTINGS_MENU:
                if (action.payload?.tab) {
                    this.currentTab = action.payload.tab;
                } else {
                    this.currentTab = 'profile';
                }
                await this.renderSettingsMenu();
                break;

            case Actions.SWITCH_SETTINGS_TAB:
                this.currentTab = action.payload.tab;
                await this.renderSettingsMenu();
                break;

            default:
                break;
        }
    }

    async renderSettingsMenu() {
        const menuContainer = document.querySelector('#settingsMenuContainer');
        if (menuContainer) {
            this.settingsMenuComponent.parent = menuContainer;
            
            const menuData = {
                currentTab: this.currentTab
            };

            await this.settingsMenuComponent.render(menuData);
        }
    }
}

export default new SettingsMenuStore();
