import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

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

    constructor(parent) {
        this.parent = parent;
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'registerDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initFormActions();
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