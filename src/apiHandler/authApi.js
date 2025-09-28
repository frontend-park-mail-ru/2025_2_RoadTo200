import handleFetch from './handler.js';
import serverURL from './serverURL.JS';

const API_URL = serverURL + '/api' + '/auth';

class AuthApi { 
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * POST /auth/register - Регистрация.
     * @param {string} email 
     * @param {string} password 
     * @param {string} passwordConfirm 
     * @returns {Promise<Object>} 
     */
    async register(email, password, passwordConfirm) {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password, passwordConfirm }),
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
