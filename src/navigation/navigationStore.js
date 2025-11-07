import { dispatcher } from '../Dispatcher.js';
import { Actions } from '../actions.js';
import { AuthUtils } from '../utils/auth.js';

/**
 * Класс маршрута.
 */
export class Route {
    /**
     * Конструктор.
     * @param {string} path (/login, /register ...).
     * @param {Object} component Компонент для отрисовки.
     * @param {boolean} [requireAuth=false] Обязательность авторизации для просмотра.
     */
    constructor(path, component, requireAuth = false) {
        this.path = path;
        this.component = component;
        this.requireAuth = requireAuth;
    }
}


class NavigationStore {
    routes = [];

    fallbackRoute = null;

    currentPath = null;

    headerContainer = null;

    menuContainer = null;

    profileMenuContainer = null;

    contentContainer = null;

    constructor() {
        dispatcher.register(this);
    }

    /**
     * Инициализация роутера с маршрутами и DOM элементами.
     */
    init(routes, rootElement) {
        this.fallbackRoute = routes.find(r => r.path === '*');
        this.routes = routes.filter(r => r.path !== '*');

        this.setupRootContainers(rootElement);
        NavigationStore.setupEventListeners();
        
        // Загружаем текущий маршрут
        dispatcher.process({ 
            type: Actions.LOAD_ROUTE,
            payload: { path: window.location.pathname + window.location.search }
        });
    }

    /**
     * Настройка контейнеров для компонентов.
     */
    setupRootContainers(rootElement) {
        // eslint-disable-next-line no-param-reassign
        rootElement.innerHTML = `
            <div id="offline-banner-container"></div>
            <div class="page-layout"> 
                <div id="menu-container-internal"></div>
                <div class="main-column">
                    <div id="header-container-internal"></div>
                    <div id="content-container"></div>
                </div>
            </div>
            <div id="profile-menu-container"></div>
        `;

        this.offlineBannerContainer = rootElement.querySelector('#offline-banner-container');
        this.headerContainer = rootElement.querySelector('#header-container-internal');
        this.menuContainer = rootElement.querySelector('#menu-container-internal');
        this.contentContainer = rootElement.querySelector('#content-container');
        this.profileMenuContainer = rootElement.querySelector('#profile-menu-container');
    }

    /**
     * Настройка слушателей событий браузера.
     */
    static setupEventListeners() {
        // Обработка кнопок назад/вперед браузера
        window.addEventListener('popstate', () => {
            dispatcher.process({ 
                type: Actions.LOAD_ROUTE,
                payload: { path: window.location.pathname + window.location.search }
            });
        });

        // Обработка кликов по ссылкам с атрибутом Link
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[Link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href') || link.href;
                try {
                    const url = new URL(href, window.location.origin);
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: url.pathname + url.search }
                    });
                } catch (error) {
                    console.error('Invalid URL:', error);
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: '/' }
                    });
                }
            }
        });
    }


    async handleAction(action) {
        switch (action.type) {
            case Actions.NAVIGATE_TO:
                await this.navigateTo(action.payload);
                break;
            case Actions.LOAD_ROUTE:
                await this.loadRoute(action.payload);
                break;
            default:
                break;
        }
    }

    /**
     * Навигация на новый URL.
     */
    async navigateTo(payload) {
        const { path } = payload;
        if (!path) {
            console.error('NavigationStore: path is required');
            return;
        }

        // Если уже на этом пути, не делаем ничего
        if (window.location.pathname + window.location.search === path) {
            return;
        }

        // Обновляем историю браузера
        window.history.pushState(null, null, path);
        
        // Загружаем новый маршрут
        await this.loadRoute({ path });
    }

    /**
     * Загрузка маршрута.
     */
    async loadRoute(payload) {
        const { path } = payload;
        const currentPath = path || window.location.pathname;

        // Предотвращаем повторную загрузку того же маршрута
        if (this.currentPath === currentPath) {
            return;
        }
        this.currentPath = currentPath;

        // Обработка динамических маршрутов (например /matches/:id)
        const matchProfileMatch = currentPath.match(/^\/matches\/([^/]+)$/);
        const normalizedPath = matchProfileMatch ? '/matches' : currentPath;

        // Находим подходящий маршрут
        let route = this.routes.find(r => r.path === normalizedPath);
        if (!route && this.fallbackRoute) {
            route = this.fallbackRoute;
        }
        if (!route) {
            return;
        }

        // Проверяем авторизацию
        const isAuthenticated = await AuthUtils.checkAuth();

        if (route.requireAuth && !isAuthenticated) {
            if (normalizedPath !== '/login') {
                await this.navigateTo({ path: '/login' });
                return;
            }
        }

        if ((normalizedPath === '/login' || normalizedPath === '/register') && isAuthenticated) {
            await this.navigateTo({ path: '/' });
            return;
        }

        // Определяем, является ли страница страницей авторизации
        const isAuthPage = normalizedPath === '/login' || normalizedPath === '/register';

        // Управляем видимостью header и menu
        this.headerContainer.style.display = isAuthPage ? 'none' : 'block';
        this.menuContainer.style.display = isAuthPage ? 'none' : 'block';

        // Очищаем контент
        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }

        // Устанавливаем parent для компонента
        if (route && route.component) {
            route.component.parent = this.contentContainer;
        }

        // Определяем action для рендеринга и его payload
        const renderAction = NavigationStore.getRouteRenderAction(normalizedPath, matchProfileMatch);

        // Диспатчим action для рендеринга страницы
        if (renderAction) {
            dispatcher.process(renderAction);
        }

        // Управляем фоном для страниц авторизации
        if (isAuthPage) {
            dispatcher.process({ type: Actions.RENDER_AUTH_BACKGROUND });
        } else {
            dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });
        }

        // Рендерим header
        dispatcher.process({ type: Actions.RENDER_HEADER });

        // Рендерим menu с правильным route
        const menuRoute = renderAction?.payload?.route || 
                         (normalizedPath === '/' ? 'main' : normalizedPath.replace(/^\//, '').split('/')[0]);
        dispatcher.process({ 
            type: Actions.RENDER_MENU, 
            payload: { route: menuRoute } 
        });

        // Если нет специального action для рендеринга, рендерим компонент напрямую
        if (route && route.component && !renderAction) {
            try {
                const contentHtml = await route.component.render();
                if (this.contentContainer) {
                    this.contentContainer.innerHTML = contentHtml;
                }
                if (route.component.controller) {
                    await route.component.controller();
                }
            } catch (error) {
                console.error('Error rendering component:', error);
            }
        }
    }

    /**
     * Получить action для рендеринга на основе пути.
     */
    static getRouteRenderAction(normalizedPath, matchProfileMatch) {
        const actionPayload = {};

        switch (normalizedPath) {
            case '/':
                actionPayload.route = 'main';
                return { type: Actions.RENDER_HOME, payload: actionPayload };
            
            case '/cards':
                actionPayload.route = 'cards';
                return { type: Actions.RENDER_CARDS, payload: actionPayload };
            
            case '/login':
                return { type: Actions.RENDER_LOGIN };
            
            case '/register':
                return { type: Actions.RENDER_REGISTER };
            
            case '/me':
                return { type: Actions.RENDER_MYCARD };
            
            case '/settings':
                actionPayload.route = 'settings';
                return { type: Actions.RENDER_SETTINGS, payload: actionPayload };
            
            case '/matches':
                actionPayload.route = 'matches';
                if (matchProfileMatch) {
                    const [, matchId] = matchProfileMatch;
                    actionPayload.matchId = matchId;
                    return { type: Actions.RENDER_MATCH_PROFILE, payload: actionPayload };
                }
                return { type: Actions.RENDER_MATCHES, payload: actionPayload };
            
            default:
                return null;
        }
    }

    /**
     * Получить контейнеры для компонентов.
     */
    getContainers() {
        return {
            header: this.headerContainer,
            menu: this.menuContainer,
            content: this.contentContainer,
            profileMenu: this.profileMenuContainer,
            offlineBanner: this.offlineBannerContainer
        };
    }
}

export default new NavigationStore();
