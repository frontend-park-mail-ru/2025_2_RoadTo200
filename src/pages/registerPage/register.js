import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

const TEMPLATE_PATH = '/src/pages/registerPage/register.hbs';

/**
 * Валидация email согласно RFC 5322 с поддержкой SMTPUTF8 (unicode/emoji)
 */
const validateEmail = (email) => {
    const emailRegex = /^[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?(?:\.[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?)*$/u;
    
    if (!emailRegex.test(email)) {
        return false;
    }
    
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return false;
    
    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);
    
    if (localPart.length > 64) {
        return false;
    }
    
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

export class RegisterPage {
    parent;

    constructor(parent) {
        this.parent = parent;
        
        // Регистрируем RegisterPage в Dispatcher для получения ошибок
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.REGISTER_ERROR:
                this.showError(action.payload.message);
                break;
            default:
                break;
        }
    }

    showError(message) {
        const errorDiv = document.querySelector('.form__error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'registerDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initPasswordToggles();
        this.initFormActions();
        
        // После того как страница отрендерена, показываем фон
        // Используем двойной requestAnimationFrame для гарантии применения стилей
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

    handleRegister = async (event) => {
        event.preventDefault();
        
        clearError();
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const passwordConfirmInput = document.getElementById('passwordConfirm');
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;
        
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
        
        if (!passwordConfirm) {
            passwordConfirmInput.classList.add('form__error-input');
            showError('Подтвердите пароль');
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
        
        // Проверка совпадения паролей
        if (password !== passwordConfirm) {
            passwordInput.classList.add('form__error-input');
            passwordConfirmInput.classList.add('error-input');
            showError('Пароли не совпадают');
            return;
        }
        
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