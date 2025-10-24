import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import { AuthBackground } from '../../components/AuthBackground/authBackground.js';
import { Header } from '../../components/Header/header.js';

const TEMPLATE_PATH = './src/pages/registerPage/register.hbs';

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон');
        }

        const templateContent = await response.text();
        
        return templateContent;

    } catch (error) {
        return '<h1>Ошибка: Не удалось загрузить шаблон</h1>'; 
    }
};

export class RegisterPage {
    parent;

    authBackground;
    authHeader;

    constructor(parent) {
        this.parent = parent;
        this.authBackground = null;
        this.authHeader = null;
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'registerDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initHeader();
        this.initFormActions();
        this.initBackground();
    }

    initHeader() {
        const headerContainer = document.querySelector('.header-container');
        if (headerContainer) {
            this.authHeader = new Header(headerContainer);
            this.authHeader.render({ isAuthenticated: false });
        }
    }

    initBackground() {
        const bgContainer = document.querySelector('.auth-background');
        if (bgContainer) {
            this.authBackground = new AuthBackground(bgContainer);
            this.authBackground.render();
        }
    }

    handleRegister = async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        
        dispatcher.process({
            type: Actions.REQUEST_REGISTER,
            payload: { email, password, passwordConfirm }
        });
    };

    initFormActions() {
        const form = document.getElementById('registerForm');
        
        if (form) {
            form.removeEventListener('submit', this.handleRegister);
            form.addEventListener('submit', this.handleRegister);
        }
    }
}

const rootElement = document.getElementById('root');
export const register = new RegisterPage(rootElement);