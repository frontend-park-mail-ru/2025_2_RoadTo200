import { AuthUtils } from './src/utils/auth.js';
import Header from './src/components/Header/header.js';
import BigHeart from './src/components/BigHeart/bigHeart.js';

export class Route {
  constructor(path, component, requireAuth = false) {
    this.path = path;
    this.component = component;
    this.requireAuth = requireAuth;
  }
}

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

    // Получаем контейнеры
    const root = document.getElementById('root');
    const headerContainer = document.getElementById('header-container');
    const bigHeartContainer = document.getElementById('big-heart-container');

    // Всегда показываем хедер и большое сердце, но с разным содержимым
    if (headerContainer) {
      // Проверяем аутентификацию для определения версии хедера
      const isAuthenticated = route.requireAuth ? await AuthUtils.checkAuth() : await AuthUtils.checkAuth();
      
      if (route.requireAuth && !isAuthenticated) {
        // Редирект на страницу логина
        if (currentPath !== '/login') {
          this.navigateTo('/login');
          return;
        }
      }
      
      // Рендерим хедер с информацией о статусе аутентификации
      const headerHtml = await Header.render(isAuthenticated);
      headerContainer.innerHTML = headerHtml;
      
      // Рендерим большое сердце на всех страницах
      const bigHeartHtml = await BigHeart.render();
      bigHeartContainer.innerHTML = bigHeartHtml;
      
      // Инициализируем обработчики событий хедера
      setTimeout(() => {
        Header.initEventListeners();
      }, 0);
    }

    // Проверки для login/register страниц
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
    } else {
        
    }
  }
}