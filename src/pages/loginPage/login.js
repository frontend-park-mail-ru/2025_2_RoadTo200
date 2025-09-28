import { AuthUtils } from '../../utils/auth.js';

import AuthApi from '../../apiHandler/authApi.js';

// const API_URL = 'http://127.0.0.1:3000/api/auth/';
const TEMPLATE_PATH = './src/pages/loginPage/login.hbs';

const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validatePassword = (password) => {
    return password.length >= 6 && !/<script|javascript:|on\w+=/i.test(password);
};

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

const sendLoginRequest = async (email, password) => {
    try {
        const data = await AuthApi.login(email, password);
        return { success: true, data: data.user };
    } catch (error) {
        console.error('Ошибка при входе:', error);
        const errorMessage = getErrorMessage(error);
        return { success: false, error: errorMessage };
    }
};

const loginPage = {
    getData: async () => {
        return {};
    },

    initFormActions: () => {
        const form = document.getElementById('loginForm');
        
        if (form) {
            const handleLogin = async (event) => {
                event.preventDefault();
                
                clearError();
                
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                
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
                
                const result = await sendLoginRequest(email, password);
                
                if (result.success) {
                    // Куки устанавливаются автоматически сервером
                    // Токен больше не нужно сохранять в localStorage
                    console.log('Login successful, cookies:', document.cookie);
                    
                    // Делаем небольшую паузу, чтобы куки успели установиться
                    setTimeout(() => {
                        console.log('Redirecting to main page...');
                        window.history.pushState(null, null, '/');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    }, 100);
                } else {
                    showError(form, result.error);
                }
            };

            form.removeEventListener('submit', handleLogin);
            form.addEventListener('submit', handleLogin);
        }
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
                loginPage.initFormActions();
            }, 0);
        }

        return renderedHtml;
    }
};

export default loginPage;