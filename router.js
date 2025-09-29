import { AuthUtils } from './src/utils/auth.js';
import Header from './src/components/Header/header.js';
import BigHeart from './src/components/BigHeart/bigHeart.js';

/**
 * Класс маршрута.
 */
export class Route {
  /**
   * Конструктор.
   * @param {string} path (/login, /regiser ...).
   * @param {Object} component Компонент для отрисовки`.
   * @param {boolean} [requireAuth=false] Обязательность авторизации для просмотра.
   */
  constructor(path, component, requireAuth = false) {
    this.path = path;
    this.component = component;
    this.requireAuth = requireAuth;
  }
}

/**
 * Класс управляющий навигацией .
 */
export class Router {
  constructor(routes) {
    this.fallbackRoute = routes.find(r => r.path === '*');
    this.routes = routes.filter(r => r.path !== '*');
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
    
    let route = this.routes.find(r => r.path === currentPath);
  
    if (!route && this.fallbackRoute) {
      route = this.fallbackRoute;
    }

    if (!route) {
        return;
    }

    const root = document.getElementById('root');
    const headerContainer = document.getElementById('header-container');
    const bigHeartContainer = document.getElementById('big-heart-container');

    if (headerContainer) {
      const isAuthenticated = route.requireAuth ? await AuthUtils.checkAuth() : await AuthUtils.checkAuth();
      
      if (route.requireAuth && !isAuthenticated) {
        if (currentPath !== '/login') {
          this.navigateTo('/login');
          return;
        }
      }
      
      const headerHtml = await Header.render(isAuthenticated);
      headerContainer.innerHTML = headerHtml;
      
      const bigHeartHtml = await BigHeart.render();
      bigHeartContainer.innerHTML = bigHeartHtml;
      
      setTimeout(() => {
        Header.initEventListeners();
      }, 0);
    }

    if (currentPath === '/login' || currentPath === '/register') {
      const isAuthenticated = await AuthUtils.checkAuth();
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to main...');
        this.navigateTo('/');
        return;
      }
    }

    if (root) {
      const contentHtml = await route.component.render();
      
      root.innerHTML = contentHtml;
      
      if (route.component.controller) {
        await route.component.controller();
      }
    } else {}
  }
}