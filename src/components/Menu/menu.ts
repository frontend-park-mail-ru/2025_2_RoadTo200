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
    badge?: number;
}

interface MenuData {
    currentRoute?: string;
    hidePremiumCta?: boolean;
    chatsBadge?: number;
    matchesBadge?: number;
}

const MENU_ITEMS_DATA: MenuItem[] = [
    {
        name: 'Главная',
        icon: 'home.svg',
        route: 'main',
        actionType: Actions.RENDER_MAIN,
    },
    {
        name: 'Анкеты',
        icon: 'explore.svg',
        route: 'cards',
        actionType: Actions.RENDER_CARDS,
    },
    {
        name: 'Мэтчи',
        icon: 'matches.svg',
        route: 'matches',
        actionType: Actions.RENDER_MATCHES,
    },
    {
        name: 'Чаты',
        icon: 'chats.svg',
        route: 'chats',
        actionType: Actions.RENDER_CHATS,
    },
    {
        name: 'Моя Анкета',
        icon: 'myCard.svg',
        route: 'me',
        actionType: Actions.RENDER_MYCARD,
    },

    // {
    //     name: 'Статистика Обращений',
    //     icon: 'statistics-circle.svg',
    //     route: 'statistics',
    //     actionType: Actions.RENDER_STATISTICS,
    // },
];

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон меню');
        }
        return await response.text();
    } catch (error) {
        // console.error('Ошибка загрузки шаблона меню:', error);
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

        const { currentRoute = 'main', hidePremiumCta = false, chatsBadge, matchesBadge } = menuData;

        const menuItems: MenuItemWithPath[] = MENU_ITEMS_DATA.map((item) => {
            const path = item.route === 'main' ? '/' : `/${item.route}`;
            let badge: number | undefined;
            
            if (item.route === 'chats' && chatsBadge) {
                badge = chatsBadge;
            } else if (item.route === 'matches' && matchesBadge) {
                badge = matchesBadge;
            }
            
            return {
                ...item,
                isActive: item.route === currentRoute,
                path,
                badge,
            };
        });

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const smallHeartHtml = await SmallHeart.render();

        const renderedHtml = template({
            menuItems,
            smallHeartHtml,
            SVG_PATH_BASE,
            hidePremiumCta,
        });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (typeof window !== 'undefined') {
            if (!this.parent) return;
            const sidebar = this.parent.querySelector('.sidebar');
            if (!sidebar) return;

            const closeSidebar = (): void => {
                if (typeof document !== 'undefined') {
                    document.body.classList.remove('menu-open');
                }
            };

            const closeButton = sidebar.querySelector('#menuCloseButton');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    closeSidebar();
                });
            }

            sidebar.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                const menuItem = target.closest(
                    '.sidebar__item'
                ) as HTMLElement | null;
                const ctaItem = target.closest(
                    '.sidebar__cta'
                ) as HTMLElement | null;
                if (ctaItem) {
                    event.preventDefault();
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: '/premium' },
                    });
                    closeSidebar();
                } else

                if (menuItem) {
                    event.preventDefault();

                    const clickedRoute = menuItem.dataset.route;
                    if (!clickedRoute) return;

                    const itemData = MENU_ITEMS_DATA.find(
                        (item) => item.route === clickedRoute
                    );

                    if (itemData) {
                        const path =
                            itemData.route === 'main'
                                ? '/'
                                : `/${itemData.route}`;

                        dispatcher.process({
                            type: Actions.NAVIGATE_TO,
                            payload: { path },
                        });

                        closeSidebar();
                    }
                }
            });
        }
    }
}

export const menu = new Menu(document.createElement('div'));
