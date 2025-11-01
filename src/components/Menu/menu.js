import { Actions } from '../../actions.js';
import { dispatcher } from '../../Dispatcher.js';

import SmallHeart from '../SmallHeart/smallHeart.js';

const TEMPLATE_PATH = './src/components/Menu/menu.hbs';
const SVG_PATH_BASE = './src/assets/menu/';

const MENU_ITEMS_DATA = [
    { name: 'Главная', icon: 'home.svg', route: 'main', actionType: Actions.RENDER_MAIN },
    { name: 'Анкеты', icon: 'explore.svg', route: 'cards', actionType: Actions.RENDER_CARDS },
    { name: 'Мэтчи', icon: 'matches.svg', route: 'matches', actionType: Actions.RENDER_MATCHES },
    { name: 'Чаты', icon: 'chats.svg', route: 'chats', actionType: Actions.RENDER_CHATS },
    { name: 'Моя Анкета', icon: 'myCard.svg', route: 'myprofile', actionType: Actions.RENDER_MYCARD },
];

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон хедера');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона меню:', error);
        return '';
    }
};

export class Menu{
    parent;

    constructor(parent) {
        this.parent = parent;
    }

    async render(menuData = {}){
        const { currentRoute = 'main' } = menuData;

        const menuItems = MENU_ITEMS_DATA.map(item => {
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

    initEventListeners() {
        if (typeof window !== 'undefined') {
            if (!this.parent) return;
            const sidebar = this.parent.querySelector('.sidebar');
            if (!sidebar) return; // template may be empty or not contain .sidebar

            sidebar.addEventListener('click', (event) => {
                const menuItem = event.target.closest('.menu-item');
                if (menuItem) {
                    event.preventDefault(); 
                    
                    const clickedRoute = menuItem.dataset.route;
                    const itemData = MENU_ITEMS_DATA.find(item => item.route === clickedRoute);

                    if (itemData && itemData.actionType) {
                        const path = itemData.route === 'main' ? '/' : `/${itemData.route}`;

                        window.history.pushState({ route: clickedRoute }, null, path);

                        window.dispatchEvent(new Event('popstate'));

                        dispatcher.process({ 
                            type: itemData.actionType,
                            payload: { route: clickedRoute } 
                        });
                    }
                }
            });
        }
    }
}

export const menu = new Menu(document.createElement('div'));