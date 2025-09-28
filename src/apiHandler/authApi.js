import handleFetch from './handler.js';

const API_URL = 'http://127.0.0.1:3000/api/auth';

class AuthApi { 
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * Вспомогательная функция отправляющая запрос
     * @param {string} endpoint Относительный путь.
     * @param {Object} options Настройки запроса.
     * @returns {Promise<Response>} Ответ сервера.
     */
    async handleFetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const fetchOptions = {
            ...options,
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json',
                ...options.headers 
            }
        }; 

        try { 
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            return response.json();
        }
        catch(error) {
            throw error;
        }
    }

    /**
     * POST /auth/register - Регистрация.
     * @param {string} email 
     * @param {string} password 
     * @param {string} name 
     * @param {number|string} age 
     * @returns {Promise<Object>} 
     */
    async register(email, password, name, age) {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password, name, age }),
        };
        return this.handleFetch('/register', options);
    }

    /**
     * POST /auth/login - Вход пользователя. Устанавливает authToken.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>} 
     */
    async login(email, password) {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        };
        return this.handleFetch('/login', options);
    }

    /**
     * GET /auth/check - Проверка статуса.
     * @returns {Promise<{authenticated: boolean}>} 
     */
    async checkAuth() {
        return this.handleFetch('/check', { method: 'GET' });
    }

    /**
     * POST /auth/logout - Выход пользователя..
     * @returns {Promise<Object>} 
     */
    async logout() {
        return this.handleFetch('/logout', { method: 'POST' });
    }
}

export default new AuthApi(API_URL);
