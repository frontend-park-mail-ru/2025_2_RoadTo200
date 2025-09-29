// const API_BASE = 'http://127.0.0.1:3000/api';

import AuthApi from '../apiHandler/authApi.js';

/**
 * Утилиты управления сессиями.
 * @namespace
 * @property {function(): Promise<boolean>} checkAuth
 * @property {function(): Promise<void>} logout
 */
export const AuthUtils = {
   
    /**
     * Отправляет запрос к API, чтобы подтвердить статус авторизации.
     * @returns {Promise<boolean>} true - если пользователь авторизан.
     */
    async checkAuth() {
        console.log('Checking session auth');
        
        try {
            const response = await AuthApi.checkAuth();
            console.log('Session check result:', response);
            return response.authenticated || false;
        } catch (error) {
            console.error('Ошибка проверки аутентификации:', error);
            return false;
        }
    },

    /**
     * Завершает сессию на сервере.
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await AuthApi.logout();
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    }
};