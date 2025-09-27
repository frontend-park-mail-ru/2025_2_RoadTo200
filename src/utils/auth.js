// Утилиты для аутентификации через куки
const API_BASE = 'http://127.0.0.1:3000/api';

export const AuthUtils = {
    // Получить значение куки по имени
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },

    // Получить токен из куки
    getToken() {
        return this.getCookie('authToken');
    },

    // Проверить наличие токена
    hasToken() {
        return !!this.getToken();
    },

    // Получить заголовки для запроса (куки передаются автоматически)
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    },

    // Проверить валидность токена на сервере
    async checkAuth() {
        console.log('Checking auth, current cookies:', document.cookie);
        
        try {
            const response = await fetch(`${API_BASE}/auth/check`, {
                method: 'GET',
                credentials: 'include', // Важно! Включаем куки в запрос
                headers: this.getAuthHeaders()
            });

            console.log('Auth check response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Auth check result:', data);
                return data.authenticated;
            }
            console.log('Auth check failed with status:', response.status);
            return false;
        } catch (error) {
            console.error('Ошибка проверки аутентификации:', error);
            return false;
        }
    },

    // Выход из системы
    async logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                credentials: 'include', // Включаем куки в запрос
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    }
};