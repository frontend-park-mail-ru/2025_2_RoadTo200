class Router {
    constructor() {
        this.routes = {};
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigateTo(e.target.getAttribute('href'));
            }
        });
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigateTo(path) {
        history.pushState(null, null, path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const handler = this.routes[path] || this.routes['/404'];
        
        if (handler) {
            handler();
        }
    }

    start() {
        this.handleRoute();
    }
}

export default Router;