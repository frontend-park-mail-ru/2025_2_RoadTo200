import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import SmallHeart from '../SmallHeart/smallHeart';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/Menu/menu.hbs';
const SVG_PATH_BASE = '/src/assets/menu/';

interface MenuItem {
    name: string;
    icon: string;
    route: string;
    actionType: string;
}

interface MenuItemWithPath extends MenuItem {
    isActive: boolean;
    path: string;
}

interface MenuData {
    currentRoute?: string;
}

const MENU_ITEMS_DATA: MenuItem[] = [
    { name: 'Главная', icon: 'home.svg', route: 'main', actionType: Actions.RENDER_MAIN },
    { name: 'Анкеты', icon: 'explore.svg', route: 'cards', actionType: Actions.RENDER_CARDS },
    { name: 'Мэтчи', icon: 'matches.svg', route: 'matches', actionType: Actions.RENDER_MATCHES },
    { name: 'Чаты', icon: 'chats.svg', route: 'chats', actionType: Actions.RENDER_CHATS },
    { name: 'Моя Анкета', icon: 'myCard.svg', route: 'me', actionType: Actions.RENDER_MYCARD },
];

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона меню:', error);
        return '<div></div>';
    }
};

export class Menu implements PageComponent {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(menuData: MenuData = {}): Promise<void> {
        if (!this.parent) return;

        const { currentRoute = 'main' } = menuData;

        const menuItems: MenuItemWithPath[] = MENU_ITEMS_DATA.map(item => {
            const path = item.route === 'main' ? '/' : `/${item.route}`;
            return {
                ...item,
                isActive: item.route === currentRoute,
                path
            };
        });

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const smallHeartHtml = await SmallHeart.render();

        const renderedHtml = template({ menuItems, smallHeartHtml, SVG_PATH_BASE });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (typeof window !== 'undefined') {
            if (!this.parent) return;
            const sidebar = this.parent.querySelector('.sidebar');
            if (!sidebar) return;

            sidebar.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                const menuItem = target.closest('.sidebar__item') as HTMLElement | null;
                if (menuItem) {
                    event.preventDefault(); 
                    
                    const clickedRoute = menuItem.dataset.route;
                    if (!clickedRoute) return;

                    const itemData = MENU_ITEMS_DATA.find(item => item.route === clickedRoute);

                    if (itemData) {
                        const path = itemData.route === 'main' ? '/' : `/${itemData.route}`;

                        dispatcher.process({ 
                            type: Actions.NAVIGATE_TO,
                            payload: { path } 
                        });
                    }
                }
            });
        }
    }
}

export const menu = new Menu(document.createElement('div'));
