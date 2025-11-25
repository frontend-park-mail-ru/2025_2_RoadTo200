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
    supportIframe: HTMLIFrameElement | null;
}

class NavigationStore implements Store {
    private routes: Route[] = [];
    private fallbackRoute: Route | null = null;
    private currentPath: string | null = null;
    private headerContainer: HTMLElement | null = null;
    private menuContainer: HTMLElement | null = null;
    private menuOverlay: HTMLElement | null = null;
    private profileMenuContainer: HTMLElement | null = null;
    private contentContainer: HTMLElement | null = null;
    private offlineBannerContainer: HTMLElement | null = null;
    private supportIframe: HTMLIFrameElement | null = null;
    private pendingSupportDimensions:
        | { width?: number; height?: number }
        | null = null;
    private readonly supportMessageHandler = (event: MessageEvent): void => {
        if (typeof window === 'undefined') return;
        if (event.origin !== window.location.origin) return;
        if (!event.data || typeof event.data !== 'object') return;
        if ((event.data as { type?: string }).type !== 'SUPPORT_WIDGET_RESIZE')
            return;
        const payload =
            (event.data as {
                payload?: { width?: number; height?: number };
            }).payload || {};

        if (!this.supportIframe) {
            this.pendingSupportDimensions = payload;
            return;
        }

        this.applySupportIframeSize(payload);
    };

    constructor() {
        dispatcher.register(this);
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.supportMessageHandler);
        }
    }

    /**
     * Инициализация роутера с маршрутами и DOM элементами
     */
    init(routes: Route[], rootElement: HTMLElement): void {
        this.fallbackRoute = routes.find((r) => r.path === '*') || null;
        this.routes = routes.filter((r) => r.path !== '*');

        this.setupRootContainers(rootElement);
        NavigationStore.setupEventListeners();

        dispatcher.process({
            type: Actions.LOAD_ROUTE,
            payload: {
                path: window.location.pathname + window.location.search,
            },
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
            <div class="menu-overlay" id="menu-overlay"></div>
            <div id="profile-menu-container"></div>
            <!--
            <iframe
                id="support-iframe"
                src="/support"
                referrerpolicy="no-referrer"
                sandbox="allow-same-origin allow-scripts allow-forms"
                scrolling="no"
            ></iframe>
            -->
        `;

        this.offlineBannerContainer = rootElement.querySelector(
            '#offline-banner-container'
        );
        this.headerContainer = rootElement.querySelector(
            '#header-container-internal'
        );
        this.menuContainer = rootElement.querySelector(
            '#menu-container-internal'
        );
        this.menuOverlay = rootElement.querySelector('#menu-overlay');
        this.contentContainer = rootElement.querySelector('#content-container');
        this.profileMenuContainer = rootElement.querySelector(
            '#profile-menu-container'
        );
        this.supportIframe = rootElement.querySelector('#support-iframe');

        if (this.supportIframe) {
            this.supportIframe.style.width = '200px';
            this.supportIframe.style.height = '72px';
            this.disableSupportScroll();
            if (this.pendingSupportDimensions) {
                this.applySupportIframeSize(this.pendingSupportDimensions);
                this.pendingSupportDimensions = null;
            }
        }

        if (this.menuOverlay) {
            this.menuOverlay.addEventListener('click', () => {
                if (typeof document !== 'undefined') {
                    document.body.classList.remove('menu-open');
                }
            });
        }
    }

    private applySupportIframeSize(
        dimensions?: { width?: number; height?: number } | null
    ): void {
        if (typeof window === 'undefined') return;
        if (!this.supportIframe || !dimensions) return;
        const { width, height } = dimensions;
        if (typeof width === 'number' && width > 0) {
            const clampedWidth = Math.min(Math.max(width, 160), 420);
            this.supportIframe.style.width = `${clampedWidth}px`;
        }
        if (typeof height === 'number' && height > 0) {
            const clampedHeight = Math.max(
                Math.min(height, window.innerHeight),
                64
            );
            this.supportIframe.style.height = `${clampedHeight + 200}px`;
        }
    }

    private disableSupportScroll(): void {
        if (!this.supportIframe) return;
        this.supportIframe.setAttribute('scrolling', 'no');
        this.supportIframe.addEventListener('load', () => {
            try {
                const iframeDoc = this.supportIframe?.contentDocument;
                if (iframeDoc?.body) {
                    iframeDoc.body.style.overflow = 'hidden';
                }
            } catch (error) {
                console.warn('Support iframe scroll lock failed', error);
            }
        });
    }

    /**
     * Настройка слушателей событий браузера
     */
    private static setupEventListeners(): void {
        window.addEventListener('popstate', () => {
            dispatcher.process({
                type: Actions.LOAD_ROUTE,
                payload: {
                    path: window.location.pathname + window.location.search,
                },
            });
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                document.body.classList.remove('menu-open');
            }
        });

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
                        payload: { path: url.pathname + url.search },
                    });
                } catch (error) {
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: '/' },
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

    private async navigateTo(action: NavigateAction): Promise<void> {
        const { path } = action.payload!;
        if (!path) {
            return;
        }

        if (window.location.pathname + window.location.search === path) {
            return;
        }

        window.history.pushState(null, '', path);
        await this.loadRoute({ type: Actions.LOAD_ROUTE, payload: { path } });
    }

    private async loadRoute(action: LoadRouteAction): Promise<void> {
        const { path } = action.payload!;
        const currentPath = path || window.location.pathname;

        // Удалили проверку this.currentPath === currentPath чтобы разрешить
        // повторный рендер при навигации назад через кнопку браузера

        if (
            this.currentPath &&
            this.currentPath.startsWith('/matches') &&
            !currentPath.startsWith('/matches')
        ) {
            matchesStore.cleanup();
        }

        this.currentPath = currentPath;

        if (typeof document !== 'undefined') {
            document.body.classList.remove('menu-open');
        }

        const matchProfileMatch = currentPath.match(/^\/matches\/([^/]+)$/);
        const normalizedPath = matchProfileMatch ? '/matches' : currentPath;

        let route = this.routes.find((r) => r.path === normalizedPath);
        if (!route && this.fallbackRoute) {
            route = this.fallbackRoute;
        }
        if (!route) {
            return;
        }

        const isAuthenticated = await AuthUtils.checkAuth();

        if (route.requireAuth && !isAuthenticated) {
            this.currentPath = null;
            if (normalizedPath !== '/login') {
                await this.navigateTo({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/login' },
                });
                return;
            }
        }

        if (
            (normalizedPath === '/login' || normalizedPath === '/register') &&
            isAuthenticated
        ) {
            this.currentPath = null;
            await this.navigateTo({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/' },
            });
            return;
        }

        const isAuthPage =
            normalizedPath === '/login' || normalizedPath === '/register';
        const isSupportPage = normalizedPath === '/support';

        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.toggle('support-route', isSupportPage);
        }

        if (this.headerContainer) {
            this.headerContainer.style.display =
                isAuthPage || isSupportPage ? 'none' : 'block';
        }
        if (this.menuContainer) {
            this.menuContainer.style.display =
                isAuthPage || isSupportPage ? 'none' : 'block';
        }
        if (this.supportIframe) {
            this.supportIframe.style.display =
                isAuthPage || isSupportPage ? 'none' : 'block';
        }

        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }

        if (route && route.component) {
            route.component.parent = this.contentContainer;
        }

        const renderAction = NavigationStore.getRouteRenderAction(
            normalizedPath,
            matchProfileMatch
        );

        if (renderAction) {
            dispatcher.process(renderAction);
        }

        if (isAuthPage) {
            dispatcher.process({ type: Actions.RENDER_AUTH_BACKGROUND });
        } else {
            dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });
        }

        dispatcher.process({ type: Actions.RENDER_HEADER });

        const menuRoute =
            (renderAction?.payload as { route?: string })?.route ||
            (normalizedPath === '/'
                ? 'main'
                : normalizedPath.replace(/^\//, '').split('/')[0]);
        dispatcher.process({
            type: Actions.RENDER_MENU,
            payload: { route: menuRoute },
        });

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
                return {
                    type: Actions.RENDER_SETTINGS,
                    payload: actionPayload,
                };
            case '/support':
                actionPayload.route = 'support';
                return { type: Actions.RENDER_SUPPORT, payload: actionPayload };
            case '/statistics':
                actionPayload.route = 'statistics';
                return {
                    type: Actions.RENDER_STATISTICS,
                    payload: actionPayload,
                };
            case '/matches':
                actionPayload.route = 'matches';
                if (matchProfileMatch) {
                    const [, matchId] = matchProfileMatch;
                    actionPayload.matchId = matchId;
                    return {
                        type: Actions.RENDER_MATCH_PROFILE,
                        payload: actionPayload,
                    };
                }
                return { type: Actions.RENDER_MATCHES, payload: actionPayload };
            case '/chats':
                console.log('NavigationStore: navigating to /chats');
                actionPayload.route = 'chats';
                return { type: Actions.RENDER_CHATS, payload: actionPayload };
            default:
                return null;
        }
    }

    getContainers(): Containers {
        return {
            header: this.headerContainer,
            menu: this.menuContainer,
            content: this.contentContainer,
            profileMenu: this.profileMenuContainer,
            offlineBanner: this.offlineBannerContainer,
            supportIframe: this.supportIframe,
        };
    }
}

export default new NavigationStore();
