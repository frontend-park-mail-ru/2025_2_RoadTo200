import { AuthUtils } from './src/utils/auth.js';
import { header } from './src/components/Header/header.js';
import { menu } from './src/components/Menu/menu.js';

import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

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

    if (currentPath !== '/login' && currentPath !== '/register') {

      this.headerContainer.style.display = 'block';
      this.menuContainer.style.display = 'block';
      
      // dispatcher.process({ type: Actions.RENDER_HEADER });
      // dispatcher.process({ type: Actions.RENDER_MENU})

    }else{
      this.headerContainer.style.display = 'none';
      this.menuContainer.style.display = 'none';
    }

    if (this.contentContainer) {
        this.contentContainer.innerHTML = '';
    }

    if (route && route.component) {
        route.component.parent = this.contentContainer;
    }

    if (currentPath === '/') {
      dispatcher.process({ type: Actions.RENDER_MAIN });
    }else if (currentPath === '/login') {
      dispatcher.process({ type: Actions.RENDER_LOGIN });
    } else if (currentPath === '/register') {
      dispatcher.process({ type: Actions.RENDER_REGISTER });
    }
  }
}