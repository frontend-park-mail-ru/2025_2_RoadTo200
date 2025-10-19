import { AuthUtils } from './src/utils/auth.js';
import Header from './src/components/Header/header.js';
import BigHeart from './src/components/BigHeart/bigHeart.js';
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
  constructor(routes) {
    this.fallbackRoute = routes.find(r => r.path === '*');
    this.routes = routes.filter(r => r.path !== '*');
    this.currentPath = null;
    this.init();
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
      dispatcher.process({ type: Actions.RENDER_HEADER });
    }

    const headerContainer = document.getElementById('header-container');
    const bigHeartContainer = document.getElementById('big-heart-container');
    const root = document.getElementById('root');

    if (headerContainer && currentPath !== '/login' && currentPath !== '/register') {
      try {
        const headerHtml = await Header.render(isAuthenticated);
        headerContainer.innerHTML = headerHtml;
        
        const bigHeartHtml = await BigHeart.render();
        bigHeartContainer.innerHTML = bigHeartHtml;
        
        setTimeout(() => {
          Header.initEventListeners();
        }, 0);
      } catch (error) {
        console.error('Error rendering header:', error);
      }
    }

    if (root) {
      root.innerHTML = '';
    }

    if (currentPath === '/') {
      dispatcher.process({ type: Actions.RENDER_MAIN });
      return;
    }else if (currentPath === '/login') {
      dispatcher.process({ type: Actions.RENDER_LOGIN });
      return;
    } else if (currentPath === '/register') {
      console.log('Router: Dispatching RENDER_REGISTER');
      dispatcher.process({ type: Actions.RENDER_REGISTER });
      return;
    }

    if (root) {
      try {
        const contentHtml = await route.component.render();
        root.innerHTML = contentHtml;
        
        if (route.component.controller) {
          await route.component.controller();
        }
      } catch (error) {
        console.error('Error rendering component:', error);
      }
    }
  }
}