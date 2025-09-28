// const API_URL = 'http://127.0.0.1:3000/api/auth/';
const TEMPLATE_PATH = './src/pages/registerPage/register.hbs';

import AuthApi from '../../apiHandler/authApi.js';

const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validatePasswordConfirm = (password, passwordConfirm) => {
    return password === passwordConfirm;
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

const sendRegisterRequest = async (email, password, passwordConfirm) => {
    try {
        const data = await AuthApi.register(email, password, passwordConfirm);
        console.log('Регистрация успешна');
        return { success: true };
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        const errorMessage = getErrorMessage(error);
        return { success: false, error: errorMessage };
    }
};

const registerPage = {
    getData: async () => {
        return {};
    },

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
                
                const result = await sendRegisterRequest(email, password, passwordConfirm);
                
                if (result.success) {
                    window.history.pushState(null, null, '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                } else {
                    showError(form, result.error);
                }
            };

            form.removeEventListener('submit', handleRegister);
            form.addEventListener('submit', handleRegister);
        }
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
                registerPage.initFormActions();
            }, 0);
        }

        return renderedHtml;
    }
};

export default registerPage;