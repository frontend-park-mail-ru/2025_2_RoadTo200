import AuthStore from '../../flux/auth/authStore.js'
import AuthActions from '../../flux/auth/authActions.js'

const TEMPLATE_PATH = './src/pages/loginPage/login.hbs';

const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validatePassword = (password) => password.length >= 6 && !/<script|javascript:|on\w+=/i.test(password);

const getErrorMessage = (error) => {
    // Ошибки сети
    if (error.isNetworkError || (error.message && error.message.includes('Network connection failed'))) {
        return 'Нет соединения с сервером. Проверьте интернет-соединение';
    }
    
    // Ошибки с кодом статуса
    if (error.status) {
        // Приоритет сообщению от сервера
        if (error.details && (error.details.message || error.details.error)) {
            return error.details.message || error.details.error;
        }
        
        // Fallback сообщения для статусов
        switch (error.status) {
            case 400:
                return 'Неверные данные для входа';
            case 401:
                return 'Неверный email или пароль';
            case 403:
                return 'Доступ запрещен';
            case 500:
                return 'Ошибка сервера. Попробуйте позже';
            default:
                return 'Не удалось войти в систему';
        }
    }
    
    // Общие ошибки
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
 * Объект страницы входа.
 * @property {function(): Promise<Object>} getData
 * @property {function(): void} initFormActions
 * @property {function(): Promise<string>} render
 */
const loginPage = {
    getData: async () => ({}),

    initFormActions: () => {
        const form = document.getElementById('loginForm');
        
        if (form) {
            const handleLogin = async (event) => {
                event.preventDefault();
                
                clearError();
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                
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
                
                await AuthActions.sendLoginRequest(email, password);
            };

            form.removeEventListener('submit', handleLogin);
            form.addEventListener('submit', handleLogin);
        }
    },

    onStoreChange: (state) => {
        const form = document.getElementById('loginForm');
        
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
        AuthStore.addSub(loginPage.onStoreChange);
    },

    unsubscribe: () => {
        AuthStore.removeSub(loginPage.onStoreChange);
    },

    render: async () => {
        const [pageData, pageTemplateString] = await Promise.all([
            loginPage.getData(), 
            fetchTemplate(TEMPLATE_PATH)
        ]);

        const pageTemplate = Handlebars.compile(pageTemplateString);
        const renderedHtml = pageTemplate(pageData);
        
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                loginPage.subscribe();
                loginPage.initFormActions();
            }, 0);
        }

        return renderedHtml;
    }
};

export default loginPage;