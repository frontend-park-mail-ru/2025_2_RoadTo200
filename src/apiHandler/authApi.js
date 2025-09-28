import handleFetch from './handler.js';

const API_URL = 'http://127.0.0.1:3000/api/auth';

class AuthApi { 
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
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
        return handleFetch( this.baseURL, '/register', options);
    }

    /**
     * POST /auth/login - Вход пользователя. Создает сессию.
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>} 
     */
    async login(email, password) {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        };
        return handleFetch( this.baseURL, '/login', options);
    }

    /**
     * GET /auth/check - Проверка статуса.
     * @returns {Promise<{authenticated: boolean}>} 
     */
    async checkAuth() {
        return handleFetch( this.baseURL, '/check', { method: 'GET' });
    }

    /**
     * POST /auth/logout - Выход пользователя. Удаляет сессию.
     * @returns {Promise<Object>} 
     */
    async logout() {
        return handleFetch( this.baseURL, '/logout', { method: 'POST' });
    }
}

export default new AuthApi(API_URL);
