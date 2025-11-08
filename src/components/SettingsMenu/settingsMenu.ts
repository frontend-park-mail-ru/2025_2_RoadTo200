/* global Handlebars */
import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';

const TEMPLATE_PATH = '/src/components/SettingsMenu/settingsMenu.hbs';

interface MenuItem {
    name: string;
    tab: string;
    icon: string;
    isActive?: boolean;
}

interface MenuData {
    currentTab?: string;
}

const MENU_ITEMS_DATA: MenuItem[] = [
    { 
        name: 'Профиль', 
        tab: 'profile',
        icon: './src/assets/settings__profile.svg'
    },
    { 
        name: 'Фильтры', 
        tab: 'filters',
        icon: './src/assets/settings__filter.svg'
    },
    { 
        name: 'Безопасность', 
        tab: 'security',
        icon: './src/assets/settings__security.svg'
    }
];

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню настроек');
        }
        return response.text();
    } catch (error) {
        // console.error('Ошибка загрузки шаблона меню настроек:', error);
        return '';
    }
};

export class SettingsMenu {
    public parent: HTMLElement;

    constructor(parent: HTMLElement) {
        this.parent = parent;
    }

    async render(menuData: MenuData = {}): Promise<void> {
        const { currentTab = 'profile' } = menuData;

        const menuItems = MENU_ITEMS_DATA.map(item => ({
            ...item,
            isActive: item.tab === currentTab
        }));

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({ menuItems });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (!this.parent) return;
        
        const sidebar = this.parent.querySelector('.settings-sidebar');
        if (!sidebar) {
            // console.error('Settings sidebar not found in parent');
            return;
        }

        // Обработчик для пунктов меню
        const menuItems = sidebar.querySelectorAll('.sidebar__item');
        menuItems.forEach(menuItem => {
            menuItem.addEventListener('click', (event: Event) => {
                event.preventDefault();
                
                const clickedTab = (menuItem as HTMLElement).dataset.tab;
                // console.log('Settings menu item clicked, tab:', clickedTab);

                if (clickedTab) {
                    dispatcher.process({ 
                        type: Actions.SWITCH_SETTINGS_TAB,
                        payload: { tab: clickedTab } 
                    });
                }
            });
        });

        // Обработчик для кнопки выхода
        const logoutBtn = sidebar.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (event: Event) => {
                event.preventDefault();
                // console.log('Logout button clicked');
                
                // Вызываем logout
                await dispatcher.process({
                    type: Actions.REQUEST_LOGOUT
                });
            });
        }
    }
}

export const settingsMenu = new SettingsMenu(document.createElement('div'));
