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
        icon: './src/assets/settings__security.svg'
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
        console.error('Ошибка загрузки шаблона меню настроек:', error);
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
        
        const sidebar = this.parent.querySelector('.sidebar');
        if (!sidebar) return;

        sidebar.addEventListener('click', (event: Event) => {
            const target = event.target as HTMLElement;
            const menuItem = target.closest('.sidebar__item') as HTMLElement;
            if (menuItem) {
                event.preventDefault();
                
                const clickedTab = menuItem.dataset.tab;

                dispatcher.process({ 
                    type: Actions.SWITCH_SETTINGS_TAB,
                    payload: { tab: clickedTab } 
                });
            }
        });
    }
}

export const settingsMenu = new SettingsMenu(document.createElement('div'));
