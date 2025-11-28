import AuthApi from '../apiHandler/authApi';

/**
 * Утилиты управления сессиями
 */
export const AuthUtils = {
    /**
     * Отправляет запрос к API, чтобы подтвердить статус авторизации
     * @returns true - если пользователь авторизован
     */
    async checkAuth(): Promise<boolean> {
        try {
            const response = await AuthApi.checkAuth();
            return response.authenticated || false;
        } catch (error) {
            // console.error('Ошибка проверки аутентификации:', error);
            return false;
        }
    },

    /**
     * Завершает сессию на сервере
     */
    async logout(): Promise<void> {
        try {
            await AuthApi.logout();
        } catch (error) {
            // console.error('Ошибка при выходе:', error);
        }
    },
};
