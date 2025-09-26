import './styles.css';
import Router from './router.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import MainPage from './pages/MainPage.js';
import apiHandler from './api.js';

class App {
    constructor() {
        this.router = new Router();
        this.initRoutes();
    }

    initRoutes() {
        const loginPage = new LoginPage(this.router);
        const registerPage = new RegisterPage(this.router);
        const mainPage = new MainPage(this.router);

        this.router.addRoute('/', async () => {
            const authCheck = await apiHandler.checkAuth();
            if (authCheck.isAuthenticated) {
                this.router.navigateTo('/main');
            } else {
                this.router.navigateTo('/login');
            }
        });

        this.router.addRoute('/login', () => {
            loginPage.render();
        });

        this.router.addRoute('/register', () => {
            registerPage.render();
        });

        this.router.addRoute('/main', () => {
            mainPage.render();
        });

        this.router.addRoute('/404', () => {
            document.getElementById('app').innerHTML = '<div class="container"><h1>404 - Страница не найдена</h1></div>';
        });

        this.router.start();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});