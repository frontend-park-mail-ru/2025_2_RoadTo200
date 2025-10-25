import { AuthUtils } from './src/utils/auth.js';
import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

// Импортируем store'ы для их инициализации
import './src/pages/loginPage/loginStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/components/Header/headerStore.js';
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

    // Управление хедером через Flux
    if (currentPath !== '/login' && currentPath !== '/register') {
      dispatcher.process({ type: Actions.RENDER_HEADER });
      // Скрываем фон на неавторизационных страницах
      dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });
    }

    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = '';
    }

    if (currentPath === '/') {
      dispatcher.process({ type: Actions.RENDER_MAIN });
      return;
    }
    
    if (currentPath === '/login') {
      dispatcher.process({ type: Actions.RENDER_LOGIN });
      return;
    }
    
    if (currentPath === '/register') {
      dispatcher.process({ type: Actions.RENDER_REGISTER });
      return;
    }
    
    // Скрываем фон на других страницах
    dispatcher.process({ type: Actions.HIDE_AUTH_BACKGROUND });

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