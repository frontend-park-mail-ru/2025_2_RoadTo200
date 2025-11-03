import { Actions } from '../../actions.js';
import { dispatcher } from '../../Dispatcher.js';

const TEMPLATE_PATH = './src/components/ProfileMenu/profileMenu.hbs';
const SVG_PATH_BASE = './src/assets/menu/';

const MENU_ITEMS_DATA = [
    { name: 'Моя Анкета', icon: 'myCard.svg', route: 'me', action: null, isLogout: false },
    { name: 'Настройки', icon: 'home.svg', route: 'settings', action: null, isLogout: false },
    { name: 'Выйти', icon: 'explore.svg', route: null, action: 'logout', isLogout: true },
];

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню профиля');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона меню профиля:', error);
        return '';
    }
};

export class ProfileMenu {
    parent;

    isVisible;

    constructor(parent) {
        this.parent = parent;
        this.isVisible = false;
    }

    async render(menuData = {}) {
        const { user, isVisible = false } = menuData;

        const userName = user?.name || user?.email?.split('@')[0] || 'Пользователь';
        const userEmail = user?.email || '';

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({ 
            userName, 
            userEmail, 
            isVisible,
            menuItems: MENU_ITEMS_DATA,
            SVG_PATH_BASE
        });

        this.parent.innerHTML = renderedHtml;
        this.isVisible = isVisible;
        this.initEventListeners();
    }

    initEventListeners() {
        if (typeof window !== 'undefined') {
            const overlay = this.parent.querySelector('#profileMenuOverlay');
            if (!overlay) return;

            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    dispatcher.process({ 
                        type: Actions.TOGGLE_PROFILE_MENU,
                        payload: { isVisible: false }
                    });
                }
            });

            const menuItems = this.parent.querySelectorAll('.profile-menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    const { route, action } = item.dataset;

                    if (action === 'logout') {
                        dispatcher.process({ type: Actions.REQUEST_LOGOUT });
                    } else if (route) {
                        dispatcher.process({ 
                            type: Actions.TOGGLE_PROFILE_MENU,
                            payload: { isVisible: false }
                        });

                        const path = route === 'me' ? '/me' : `/${route}`;
                        window.history.pushState({ route }, null, path);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                });
            });
        }
    }

    toggle(visible) {
        const overlay = this.parent.querySelector('#profileMenuOverlay');
        if (overlay) {
            if (visible) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
            this.isVisible = visible;
        }
    }
}

export const profileMenu = new ProfileMenu(document.createElement('div'));
