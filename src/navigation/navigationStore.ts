import { dispatcher } from '../Dispatcher';
import { Actions, Action, NavigateAction, LoadRouteAction } from '../actions';
import { AuthUtils } from '../utils/auth';
import type { Store } from '../Dispatcher';
import matchesStore from '../pages/matchesPage/matchesStore';

export interface PageComponent {
    parent: HTMLElement | null;
    render(): Promise<void> | void;
    controller?(): Promise<void> | void;
}

/**
 * Класс маршрута
 */
export class Route {
    path: string;
    component: PageComponent;
    requireAuth: boolean;

    /**
     * Конструктор
     * @param path Путь маршрута (/login, /register ...)
     * @param component Компонент для отрисовки
     * @param requireAuth Обязательность авторизации для просмотра
     */
    constructor(path: string, component: PageComponent, requireAuth = false) {
        this.path = path;
        this.component = component;
        this.requireAuth = requireAuth;
    }
}

interface Containers {
    header: HTMLElement | null;
    menu: HTMLElement | null;
    content: HTMLElement | null;
    profileMenu: HTMLElement | null;
    offlineBanner: HTMLElement | null;
}

class NavigationStore implements Store {
    private routes: Route[] = [];
    private fallbackRoute: Route | null = null;
    private currentPath: string | null = null;
    private headerContainer: HTMLElement | null = null;
    private menuContainer: HTMLElement | null = null;
    private profileMenuContainer: HTMLElement | null = null;
    private contentContainer: HTMLElement | null = null;
    private offlineBannerContainer: HTMLElement | null = null;

    constructor() {
        dispatcher.register(this);
    }

    /**
     * Инициализация роутера с маршрутами и DOM элементами
     */
    init(routes: Route[], rootElement: HTMLElement): void {
        this.fallbackRoute = routes.find(r => r.path === '*') || null;
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
     * Настройка контейнеров для компонентов
     */
    private setupRootContainers(rootElement: HTMLElement): void {
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
     * Настройка слушателей событий браузера
     */
    private static setupEventListeners(): void {
        // Обработка кнопок назад/вперед браузера
        window.addEventListener('popstate', () => {
            dispatcher.process({ 
                type: Actions.LOAD_ROUTE,
                payload: { path: window.location.pathname + window.location.search }
            });
        });

        // Обработка кликов по ссылкам с атрибутом Link
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest('[Link]') as HTMLAnchorElement | null;
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
                    // console.error('Invalid URL:', error);
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: '/' }
                    });
                }
            }
        });
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.NAVIGATE_TO:
                await this.navigateTo(action as NavigateAction);
                break;
            case Actions.LOAD_ROUTE:
                await this.loadRoute(action as LoadRouteAction);
                break;
            default:
                break;
        }
    }

    /**
     * Навигация на новый URL
     */
    private async navigateTo(action: NavigateAction): Promise<void> {
        const { path } = action.payload!;
        if (!path) {
            // console.error('NavigationStore: path is required');
            return;
        }

        // Если уже на этом пути, не делаем ничего
        if (window.location.pathname + window.location.search === path) {
            return;
        }

        // Обновляем историю браузера
        window.history.pushState(null, '', path);
        
        // Загружаем новый маршрут
        await this.loadRoute({ type: Actions.LOAD_ROUTE, payload: { path } });
    }

    /**
     * Загрузка маршрута
     */
    private async loadRoute(action: LoadRouteAction): Promise<void> {
        const { path } = action.payload!;
        const currentPath = path || window.location.pathname;

        // Предотвращаем повторную загрузку того же маршрута
        if (this.currentPath === currentPath) {
            return;
        }

        // Очищаем interval timer страницы matches при уходе с неё
        if (this.currentPath && this.currentPath.startsWith('/matches') && !currentPath.startsWith('/matches')) {
            matchesStore.cleanup();
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

        // Проверяем авторизацию ПЕРЕД любыми другими действиями
        const isAuthenticated = await AuthUtils.checkAuth();

        if (route.requireAuth && !isAuthenticated) {
            // Сбрасываем currentPath чтобы позволить редирект
            this.currentPath = null;
            if (normalizedPath !== '/login') {
                await this.navigateTo({ type: Actions.NAVIGATE_TO, payload: { path: '/login' } });
                return;
            }
        }

        if ((normalizedPath === '/login' || normalizedPath === '/register') && isAuthenticated) {
            // Сбрасываем currentPath чтобы позволить редирект
            this.currentPath = null;
            await this.navigateTo({ type: Actions.NAVIGATE_TO, payload: { path: '/' } });
            return;
        }

        // Определяем, является ли страница страницей авторизации
        const isAuthPage = normalizedPath === '/login' || normalizedPath === '/register';

        // Управляем видимостью header и menu
        if (this.headerContainer) {
            this.headerContainer.style.display = isAuthPage ? 'none' : 'block';
        }
        if (this.menuContainer) {
            this.menuContainer.style.display = isAuthPage ? 'none' : 'block';
        }

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
        const menuRoute = (renderAction?.payload as { route?: string })?.route || 
                         (normalizedPath === '/' ? 'main' : normalizedPath.replace(/^\//, '').split('/')[0]);
        dispatcher.process({ 
            type: Actions.RENDER_MENU, 
            payload: { route: menuRoute } 
        });

        // Если нет специального action для рендеринга, рендерим компонент напрямую
        if (route && route.component && !renderAction) {
            try {
                await route.component.render();
                if (route.component.controller) {
                    await route.component.controller();
                }
            } catch (error) {
                // console.error('Error rendering component:', error);
            }
        }
    }

    /**
     * Получить action для рендеринга на основе пути
     */
    private static getRouteRenderAction(
        normalizedPath: string,
        matchProfileMatch: RegExpMatchArray | null
    ): Action | null {
        const actionPayload: Record<string, string> = {};

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
     * Получить контейнеры для компонентов
     */
    getContainers(): Containers {
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
