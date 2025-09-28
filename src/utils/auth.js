// Утилиты для аутентификации через сессии
const API_BASE = 'http://127.0.0.1:3000/api';

import AuthApi from '../apiHandler/authApi.js';

export const AuthUtils = {
    // Проверить валидность сессии на сервере
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

    // Выход из системы
    async logout() {
        try {
            await AuthApi.logout();
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    }
};