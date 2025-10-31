import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

import { menu } from './menu.js'; 

class MenuStore{
    currentRoute; 
    
    menuComponent; 

    constructor() {

        this.currentRoute = 'main';
        
        dispatcher.register(this);

        this.menuComponent = menu;
        
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MENU:
                if (action.payload && action.payload.route) {
                    if (this.currentRoute === action.payload.route) return;
                    this.currentRoute = action.payload.route;
                }
                await this.renderMenu(); 
                break;
            
            case Actions.RENDER_MAIN:
            case Actions.RENDER_CARDS:
            case Actions.RENDER_MATCHES:
            case Actions.RENDER_CHATS:
            case Actions.RENDER_MYCARD:
                if (action.payload && action.payload.route) {
                    this.currentRoute = action.payload.route;
                    await this.renderMenu();
                }
                break;

            default:
                break;
        }
    }

    async renderMenu() {

        const menuData = {
            currentRoute: this.currentRoute
        };
        
        await this.menuComponent.render(menuData);
       
    }
}

export default new MenuStore();
