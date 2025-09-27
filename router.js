import { AuthUtils } from './src/utils/auth.js';

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

    // Проверяем аутентификацию для защищенных роутов
    if (route.requireAuth) {
      const isAuthenticated = await AuthUtils.checkAuth();
      if (!isAuthenticated) {
        // Редирект на страницу логина
        if (currentPath !== '/login') {
          this.navigateTo('/login');
          return;
        }
      }
    } else if (currentPath === '/login' || currentPath === '/register') {
      // Если пользователь уже авторизован и пытается зайти на login/register
      console.log('Checking auth for login/register page...');
      const isAuthenticated = await AuthUtils.checkAuth();
      console.log('Auth check result:', isAuthenticated);
      if (isAuthenticated) {
        console.log('User is authenticated, redirecting to main...');
        this.navigateTo('/');
        return;
      }
    }

    const root = document.getElementById('root');

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