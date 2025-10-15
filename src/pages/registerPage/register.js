import AuthStore from '../../flux/auth/authStore.js'
import AuthActions from '../../flux/auth/authActions.js'

const TEMPLATE_PATH = './src/pages/registerPage/register.hbs';

const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validatePasswordConfirm = (password, passwordConfirm) => password === passwordConfirm;

const validatePassword = (password) => password.length >= 6 && !/<script|javascript:|on\w+=/i.test(password);

const getErrorMessage = (error) => {
    if (error.isNetworkError || (error.message && error.message.includes('Network connection failed'))) {
        return 'Нет соединения с сервером. Проверьте интернет-соединение';
    }
    
    if (error.status) {
        if (error.details && (error.details.message || error.details.error)) {
            return error.details.message || error.details.error;
        }
        
        switch (error.status) {
            case 400:
                return 'Неверные данные для регистрации';
            case 401:
                return 'Не удалось подтвердить данные для регистрации';
            case 409:
                return 'Пользователь с таким email уже существует';
            case 500:
                return 'Ошибка сервера. Попробуйте позже';
            default:
                return 'Не удалось создать аккаунт';
        }
    }
    
    return error.message || 'Произошла неожиданная ошибка';
};

const showError = (form, message) => {
    let errorDiv = document.querySelector('.error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        form.insertBefore(errorDiv, form.firstChild);
    }
    errorDiv.textContent = message;
};

const clearError = () => {
    const errorDiv = document.querySelector('.error');
    if (errorDiv) {
        errorDiv.remove();
    }
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

/**
 * Объект страницы регистрации.
 * @property {function(): Promise<Object>} getData
 * @property {function(): void} initFormActions
 * @property {function(): Promise<string>} render
 */
const registerPage = {
    getData: async () => ({}),

    initFormActions: () => {
        const form = document.getElementById('registerForm');
        
        if (form) {
            const handleRegister = async (event) => {
                event.preventDefault();
                
                clearError();
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('passwordConfirm').value;
                
                // Валидация
                if (!email) {
                    showError(form, 'Введите email');
                    return;
                }
                
                if (!validateEmail(email)) {
                    showError(form, 'Введите корректный email');
                    return;
                }
                
                if (!password) {
                    showError(form, 'Введите пароль');
                    return;
                }
                
                if (!validatePassword(password)) {
                    showError(form, 'Пароль должен быть не менее 6 символов');
                    return;
                }
                
                if (!passwordConfirm) {
                    showError(form, 'Введите подтверждение пароля');
                    return;
                }
                
                if (!validatePasswordConfirm(password, passwordConfirm)) {
                    showError(form, 'Пароли не совпадают');
                    return;
                }
                
                AuthActions.sendRegisterRequest(email, password, passwordConfirm);
            };

            form.removeEventListener('submit', handleRegister);
            form.addEventListener('submit', handleRegister);
        }
    },

    onStoreChange: (state) => {
        const form = document.getElementById('registerForm');
        
        if (!form) return;

        if (state.user) {
            clearError();
            window.history.pushState(null, null, '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } else if (state.error) {
            const errorMessage = getErrorMessage(state.error);
            showError(form, errorMessage);
        }
    },

    subscribe: () => {
        AuthStore.addSub(registerPage.onStoreChange);
    },

    unsubscribe: () => {
        AuthStore.removeSub(registerPage.onStoreChange);
    },

    render: async () => {
        const [pageData, pageTemplateString] = await Promise.all([
            registerPage.getData(), 
            fetchTemplate(TEMPLATE_PATH)
        ]);

        const pageTemplate = Handlebars.compile(pageTemplateString);
        const renderedHtml = pageTemplate(pageData);
        
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                registerPage.subscribe();
                registerPage.initFormActions();
            }, 0);
        }

        return renderedHtml;
    }
};

export default registerPage;