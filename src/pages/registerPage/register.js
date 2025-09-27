const API_URL = 'http://127.0.0.1:3000/api/auth/';
const TEMPLATE_PATH = './src/pages/registerPage/register.hbs';

const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validateName = (name) => {
    return /^[a-zA-Zа-яА-Я\s]{2,50}$/.test(name);
};

const validateAge = (age) => {
    const ageNum = parseInt(age, 10);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
};

const validatePassword = (password) => {
    return password.length >= 6 && !/<script|javascript:|on\w+=/i.test(password);
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

const sendRegisterRequest = async (email, password, name, age) => {
    const url = `${API_URL}register`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, age })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error(`Ошибка регистрации`, response.statusText);
            return { success: false, error: data.message || 'Ошибка регистрации' };
        } else {
            console.log(`Регистрация успешна`);
            return { success: true, data };
        }
    } catch (error) {
        console.error('Ошибка', error);
        return { success: false, error: 'Ошибка сети' };
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
                
                const name = document.getElementById('name').value.trim();
                const age = document.getElementById('age').value;
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                
                // Валидация
                if (!name) {
                    showError(form, 'Введите имя');
                    return;
                }
                
                if (!validateName(name)) {
                    showError(form, 'Имя должно содержать от 2 до 50 символов и только буквы');
                    return;
                }
                
                if (!age) {
                    showError(form, 'Введите возраст');
                    return;
                }
                
                if (!validateAge(age)) {
                    showError(form, 'Возраст должен быть от 18 до 100 лет');
                    return;
                }
                
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
                
                const result = await sendRegisterRequest(email, password, name, age);
                
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