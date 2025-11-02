import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

const TEMPLATE_PATH = './src/pages/loginPage/login.hbs';

/**
 * Валидация email RFC 5322 SMTPUTF8 
 */
const validateEmail = (email) => {
    const emailRegex = /^[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?)*$/u;
    
    if (!emailRegex.test(email)) {
        return false;
    }
    
    // Проверка длины до @
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return false;
    
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);
    
    if (localPart.length > 64) {
        return false;
    }
    
    // Проверка на недопустимые символы в domain
    if (domain && domain.includes('_')) {
        return false;
    }
    
    return true;
};

const showError = (message) => {
    const errorDiv = document.querySelector('.form__error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
};

const clearError = () => {
    const errorDiv = document.querySelector('.form__error-message');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    // Убираем красную обводку с полей
    document.querySelectorAll('.form__input').forEach(input => {
        input.classList.remove('form__error-input');
    });
};

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
        
        // Регистрируем LoginPage в Dispatcher для получения ошибок
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.LOGIN_ERROR:
                console.log('LOGIN_ERROR received:', action.payload);
                this.showError(action.payload.message);
                break;
            default:
                break;
        }
    }

    showError(message) {
        console.log('showError called with:', message);
        
        // Try multiple selectors to find the error div
        let errorDiv = document.querySelector('.form__error-message');
        
        if (!errorDiv) {
            errorDiv = document.querySelector('#loginDiv .form__error-message');
        }
        
        if (!errorDiv) {
            errorDiv = document.querySelector('#loginForm .form__error-message');
        }
        
        console.log('errorDiv found:', errorDiv);
        console.log('errorDiv exists:', !!errorDiv);
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            console.log('Error displayed successfully');
        } else {
            console.error('Could not find .error-message element in DOM');
            console.log('Current DOM:', document.body.innerHTML);
        }
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'loginDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initPasswordToggles();
        this.initFormActions();
        
        // После того как страница отрендерена, показываем фон
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                dispatcher.process({ type: Actions.RENDER_AUTH_BACKGROUND });
            });
        });
    }

    initPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.form__password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const wrapper = button.closest('.form__password-wrapper');
                const input = wrapper.querySelector('input');
                const icon = button.querySelector('.eye-icon');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.src = './src/assets/Eyes/open_eye.svg';
                    icon.alt = 'Скрыть пароль';
                } else {
                    input.type = 'password';
                    icon.src = './src/assets/Eyes/close_eye.svg';
                    icon.alt = 'Показать пароль';
                }
            });
        });
    }

    handleLogin = async (event) => {
        event.preventDefault();
        
        clearError();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Проверка на пустые поля
        if (!email) {
            emailInput.classList.add('form__error-input');
            showError('Введите email');
            return;
        }
        
        if (!password) {
            passwordInput.classList.add('form__error-input');
            showError('Введите пароль');
            return;
        }
        
        // Валидация email
        if (!validateEmail(email)) {
            emailInput.classList.add('form__error-input');
            showError('Некорректный email');
            return;
        }
        
        // Валидация пароля
        if (password.length < 6) {
            passwordInput.classList.add('form__error-input');
            showError('Пароль должен содержать минимум 6 символов');
            return;
        }
        
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