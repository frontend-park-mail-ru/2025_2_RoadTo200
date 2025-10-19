const TEMPLATE_PATH = './src/pages/loginPage/login.hbs';

import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

// 
// const validateEmail = (email) => {
//     const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
// };

// const validatePassword = (password) => password.length >= 6 && !/<script|javascript:|on\w+=/i.test(password);

// const showError = (form, message) => {
//     let errorDiv = document.querySelector('.error');
//     if (!errorDiv) {
//         errorDiv = document.createElement('div');
//         errorDiv.className = 'error';
//         form.insertBefore(errorDiv, form.firstChild);
//     }
//     errorDiv.textContent = message;
// };

// const clearError = () => {
//     const errorDiv = document.querySelector('.error');
//     if (errorDiv) {
//         errorDiv.remove();
//     }
// };

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

export class LoginPage {
    parent;

    constructor(parent) {
        this.parent = parent;
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'loginDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initFormActions();
    }

    handleLogin = async (event) => {
        event.preventDefault();
        
        const form = document.getElementById('loginForm');
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        dispatcher.process({
            type: Actions.REQUEST_LOGIN,
            payload: { email, password }
        });
    };

    initFormActions() {
        const form = document.getElementById('loginForm');
        
        if (form) {
            form.removeEventListener('submit', this.handleLogin);
            form.addEventListener('submit', this.handleLogin);
        }
    }
}

const rootElement = document.getElementById('root');
export const login = new LoginPage(rootElement);