import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { menu } from './menu';
import type { Store } from '../../Dispatcher';

class MenuStore implements Store {
    private currentRoute = 'main';
    private menuComponent = menu;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MENU:
                if (action.payload && (action.payload as { route?: string }).route) {
                    this.currentRoute = (action.payload as { route: string }).route;
                } else if (typeof window !== 'undefined') {
                    const path = window.location.pathname || '/';
                    this.currentRoute = path === '/' ? 'main' : path.replace(/^\//, '').split('/')[0];
                }
                await this.renderMenu();
                break;

            default:
                break;
        }
    }

    private async renderMenu(): Promise<void> {
        const menuData = {
            currentRoute: this.currentRoute
        };
        
        await this.menuComponent.render(menuData);
    }
}

export default new MenuStore();
