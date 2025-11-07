import { Actions } from '../../actions.js';
import { dispatcher } from '../../Dispatcher.js';


const TEMPLATE_PATH = '/src/components/SettingsMenu/settingsMenu.hbs';

const MENU_ITEMS_DATA = [
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

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню настроек');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона меню настроек:', error);
        return '';
    }
};

export class SettingsMenu {
    parent;

    constructor(parent) {
        this.parent = parent;
    }

    async render(menuData = {}) {
        const { currentTab = 'profile' } = menuData;

        const menuItems = MENU_ITEMS_DATA.map(item => ({
            ...item,
            isActive: item.tab === currentTab
        }));

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        // eslint-disable-next-line no-undef
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({ menuItems });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    initEventListeners() {
        if (!this.parent) return;
        
        const sidebar = this.parent.querySelector('.sidebar');
        if (!sidebar) return;

        sidebar.addEventListener('click', (event) => {
            const menuItem = event.target.closest('.sidebar__item');
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
