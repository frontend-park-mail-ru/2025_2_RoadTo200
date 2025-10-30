import { AuthUtils } from './src/utils/auth.js';
import { header } from './src/components/Header/header.js';
import { menu } from './src/components/Menu/menu.js';

import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

import './src/pages/loginPage/loginStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/pages/matchesPage/matchesStore.js';
import './src/components/Header/headerStore.js';
import './src/components/Menu/menuStore.js';
import './src/components/AuthBackground/authBackgroundStore.js';

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
    `;

    this.headerContainer = this.rootElement.querySelector('#header-container-internal');
    this.menuContainer = this.rootElement.querySelector('#menu-container-internal');
    this.contentContainer = this.rootElement.querySelector('#content-container');

    header.parent = this.headerContainer;
    menu.parent = this.menuContainer;

    dispatcher.process({ type: Actions.RENDER_HEADER });
    dispatcher.process({ type: Actions.RENDER_MENU});
  }

  init() {
    this.loadRoute();
    
    window.addEventListener('popstate', () => {
      this.loadRoute();
    });
    
    document.addEventListener('click', (e) => {
      if (e.target.matches('[Link]')) {
        e.preventDefault();
        const url = e.target.href || e.target.getAttribute('href');
        if (url) {
          this.navigateTo(url);
        }
      }
    });
  }

  navigateTo(url) {
    history.pushState(null, null, url);
    this.loadRoute();
  }

  async loadRoute() {
    const currentPath = location.pathname;

    if (this.currentPath === currentPath) {
      return;
    }
    this.currentPath = currentPath;

    let route = this.routes.find(r => r.path === currentPath);

    if (!route && this.fallbackRoute) {
      route = this.fallbackRoute;
    }

    if (!route) {
      return;
    }

    const isAuthenticated = await AuthUtils.checkAuth();

    if (route.requireAuth && !isAuthenticated) {
      if (currentPath !== '/login') {
        this.navigateTo('/login');
        return;
      }
    }

    if ((currentPath === '/login' || currentPath === '/register') && isAuthenticated) {
      this.navigateTo('/');
      return;
    }

    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    
    this.headerContainer.style.display = isAuthPage ? 'none' : 'block';
    this.menuContainer.style.display = isAuthPage ? 'none' : 'block';

    if (this.contentContainer) {
        this.contentContainer.innerHTML = ''; 
    }

    if (route && route.component) {
        route.component.parent = this.contentContainer;
    }

    let renderActionType = null;

    if (currentPath === '/') {
      renderActionType = Actions.RENDER_MAIN;
    } else if (currentPath === '/login') {
      renderActionType = Actions.RENDER_LOGIN;
    } else if (currentPath === '/register') {
      renderActionType = Actions.RENDER_REGISTER;
    }
    
    if (renderActionType) {
        dispatcher.process({ type: renderActionType });
    }

    if (isAuthPage) {
    } else {
        
        dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });
    }
    
    dispatcher.process({ type: Actions.RENDER_HEADER });
    dispatcher.process({ type: Actions.RENDER_MENU });

    if (route && route.component && !renderActionType) {
        try {
            const contentHtml = await route.component.render();
            
            if (this.contentContainer) {
              this.contentContainer.innerHTML = contentHtml;
            } else {
              root.innerHTML += contentHtml;
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