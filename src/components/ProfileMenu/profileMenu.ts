import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/ProfileMenu/profileMenu.hbs';
const SVG_PATH_BASE = '/src/assets/menu/';

interface ProfileMenuItem {
    name: string;
    icon: string;
    route: string | null;
    action: string | null;
    isLogout: boolean;
}

interface User {
    name?: string;
    email?: string;
    [key: string]: unknown;
}

interface ProfileMenuData {
    user?: User | null;
    isVisible?: boolean;
}

const MENU_ITEMS_DATA: ProfileMenuItem[] = [
    { name: 'Моя Анкета', icon: 'profileMenu__profile.svg', route: 'me', action: null, isLogout: false },
    { name: 'Настройки', icon: 'settings.svg', route: 'settings', action: null, isLogout: false },
    { name: 'Выйти', icon: 'exit.svg', route: null, action: 'logout', isLogout: true },
];

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню профиля');
        }
        return await response.text();
    } catch (error) {
        // console.error('Ошибка загрузки шаблона меню профиля:', error);
        return '';
    }
};

export class ProfileMenu implements PageComponent {
    parent: HTMLElement | null;
    private isVisible = false;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(menuData: ProfileMenuData = {}): Promise<void> {
        if (!this.parent) return;

        const { user, isVisible = false } = menuData;

        const userName = user?.name && user.name.length > 10  ? `${String(user?.name).slice(0, 10)}...` : `${String(user?.name)}`;
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

    private initEventListeners(): void {
        if (typeof window !== 'undefined' && this.parent) {
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
                    
                    const element = item as HTMLElement;
                    const route = element.dataset.route;
                    const action = element.dataset.action;

                    if (action === 'logout') {
                        dispatcher.process({ type: Actions.REQUEST_LOGOUT });
                        dispatcher.process({ 
                            type: Actions.TOGGLE_PROFILE_MENU,
                            payload: { isVisible: false }
                        });
                        
                    } else if (route) {
                        dispatcher.process({ 
                            type: Actions.TOGGLE_PROFILE_MENU,
                            payload: { isVisible: false }
                        });

                        const path = route === 'me' ? '/me' : `/${route}`;
                        dispatcher.process({
                            type: Actions.NAVIGATE_TO,
                            payload: { path }
                        });
                    }
                });
            });
        }
    }

    toggle(visible: boolean): void {
        // console.log('ProfileMenu.toggle called with:', visible);
        
        if (!this.parent) {
            // console.warn('ProfileMenu parent is null');
            return;
        }

        const overlay = this.parent.querySelector('#profileMenuOverlay') as HTMLElement | null;
        // console.log('Found overlay:', !!overlay);
        
        if (overlay) {
            if (visible) {
                overlay.classList.remove('hidden');
                overlay.classList.add('profile-menu-overlay--active');
            } else {
                overlay.classList.add('hidden');
                overlay.classList.remove('profile-menu-overlay--active');
            }
            // console.log('Overlay classes:', overlay.className);
        }

        this.isVisible = visible;
    }
}

export const profileMenu = new ProfileMenu(document.createElement('div'));
