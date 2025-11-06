import { AuthUtils } from './src/utils/auth.js';
import { header } from './src/components/Header/header.js';
import { menu } from './src/components/Menu/menu.js';
import { profileMenu } from './src/components/ProfileMenu/profileMenu.js';

import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

import './src/pages/loginPage/loginStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/components/Header/headerStore.js';
import './src/components/AuthBackground/authBackgroundStore.js';
import './src/components/SettingsMenu/settingsMenuStore.js';


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

/**
 * Класс управляющий навигацией.
 */
export class Router {
    fallbackRoute;

    routes;

    currentPath = null;

    rootElement;

    headerContainer = null;

    menuContainer = null;

    profileMenuContainer = null;

    contentContainer = null;

    constructor(routes) {
        this.fallbackRoute = routes.find(r => r.path === '*');
        this.routes = routes.filter(r => r.path !== '*');

        this.rootElement = document.getElementById('root');
    
        this.setupRootContainers();
    
        Promise.resolve().then(() => this.init());
    }

    setupRootContainers() {
        this.rootElement.innerHTML = `
        <div class="page-layout"> 
            
            <div id="menu-container-internal"></div>
            
            <div class="main-column">
                <div id="header-container-internal"></div>
                <div id="content-container"></div>
            </div>
            
        </div>
        <div id="profile-menu-container"></div>
    `;

        this.headerContainer = this.rootElement.querySelector('#header-container-internal');
        this.menuContainer = this.rootElement.querySelector('#menu-container-internal');
        this.contentContainer = this.rootElement.querySelector('#content-container');
        this.profileMenuContainer = this.rootElement.querySelector('#profile-menu-container');

        header.parent = this.headerContainer;
        menu.parent = this.menuContainer;
        profileMenu.parent = this.profileMenuContainer;

        dispatcher.process({ type: Actions.RENDER_HEADER });
        dispatcher.process({ type: Actions.RENDER_PROFILE_MENU });
        
    }

    init() {
        this.loadRoute();
    
        window.addEventListener('popstate', () => {
            this.loadRoute();
        });
    
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[Link]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href') || link.href;
                try {
                    const url = new URL(href, window.location.origin);
                    this.navigateTo(url.pathname + url.search);
                } catch (error) {
                    console.error('Invalid URL:', error);
                    this.navigateTo('/');
                }
            }
        });
    }

    navigateTo(url) {
        window.history.pushState(null, null, url);
        this.loadRoute();
    }

    async loadRoute() {
        const currentPath = window.location.pathname;

        if (this.currentPath === currentPath) {
            return;
        }
        this.currentPath = currentPath;

        const matchProfileMatch = currentPath.match(/^\/matches\/([^/]+)$/);
        const normalizedPath = matchProfileMatch ? '/matches' : currentPath;

        let route = this.routes.find(r => r.path === normalizedPath);

        if (!route && this.fallbackRoute) {
            route = this.fallbackRoute;
        }

        if (!route) {
            return;
        }

        const isAuthenticated = await AuthUtils.checkAuth();

        if (route.requireAuth && !isAuthenticated) {
            if (normalizedPath !== '/login') {
                this.navigateTo('/login');
                return;
            }
        }

        if ((normalizedPath === '/login' || normalizedPath === '/register') && isAuthenticated) {
            this.navigateTo('/');
            return;
        }

        const isAuthPage = normalizedPath === '/login' || normalizedPath === '/register';
    
        this.headerContainer.style.display = isAuthPage ? 'none' : 'block';
        this.menuContainer.style.display = isAuthPage ? 'none' : 'block';

        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }

        if (route && route.component) {
            route.component.parent = this.contentContainer;
        }

        let renderActionType = null;
        const actionPayload = {};

        if (normalizedPath === '/') {
            // Редирект с главной на /cards
            this.navigateTo('/cards');
            return;
        }
        
        if (normalizedPath === '/cards') {
            renderActionType = Actions.RENDER_CARDS;
            actionPayload.route = 'cards';
        } else if (normalizedPath === '/login') {
            renderActionType = Actions.RENDER_LOGIN;
        } else if (normalizedPath === '/register') {
            renderActionType = Actions.RENDER_REGISTER;
        } else if (normalizedPath === '/me') {
            renderActionType = Actions.RENDER_MYCARD;
        } else if (normalizedPath === '/settings') {
            renderActionType = Actions.RENDER_SETTINGS;
            actionPayload.route = 'settings';
        } else if (normalizedPath === '/matches') {
            actionPayload.route = 'matches';
            if (matchProfileMatch) {
                const [, matchId] = matchProfileMatch;
                actionPayload.matchId = matchId;
                renderActionType = Actions.RENDER_MATCH_PROFILE;
            } else {
                renderActionType = Actions.RENDER_MATCHES;
            }
        }
    
        if (renderActionType) {
            const action = { type: renderActionType };
            if (Object.keys(actionPayload).length > 0) {
                action.payload = actionPayload;
            }
            dispatcher.process(action);
        }

        if (isAuthPage) {
            dispatcher.process({ type: Actions.RENDER_AUTH_BACKGROUND });
        } else {
            dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });
        }
    
        dispatcher.process({ type: Actions.RENDER_HEADER });

        const menuRoute = actionPayload.route || (normalizedPath === '/' ? 'main' : normalizedPath.replace(/^\//, '').split('/')[0]);
        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: menuRoute } });

        if (route && route.component && !renderActionType) {
            try {
                const contentHtml = await route.component.render();
            
                if (this.contentContainer) {
                    this.contentContainer.innerHTML = contentHtml;
                } else if (this.rootElement) {
                    this.rootElement.innerHTML += contentHtml;
                }
            
                if (route.component.controller) {
                    await route.component.controller();
                }
            } catch (error) {
                console.error('Error rendering component:', error);
            }
        }
    }
}