import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api`;

export interface RegisterRequest {
    email: string;
    password: string;
    passwordConfirm: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
}

export interface CheckAuthResponse {
    authenticated: boolean;
    user?: {
        id: string;
        email: string;
    };
}

class AuthApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * POST /auth/register - Регистрация
     * @param email Email пользователя
     * @param password Пароль
     * @param passwordConfirm Подтверждение пароля
     * @returns Promise с ответом сервера
     */
    async register(email: string, password: string, passwordConfirm: string): Promise<AuthResponse> {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password, passwordConfirm }),
        };
        return handleFetch<AuthResponse>(this.baseURL, '/register', options);
    }

    /**
     * POST /auth/login - Вход пользователя. Создает сессию
     * @param email Email пользователя
     * @param password Пароль
     * @returns Promise с ответом сервера
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        };
        return handleFetch<AuthResponse>(this.baseURL, '/login', options);
    }

    /**
     * GET /auth/check - Проверка статуса аутентификации
     * @returns Promise с статусом аутентификации
     */
    async checkAuth(): Promise<CheckAuthResponse> {
        return handleFetch<CheckAuthResponse>(this.baseURL, '/session', { method: 'GET' });
    }

    /**
     * POST /auth/logout - Выход пользователя. Удаляет сессию
     * @returns Promise с ответом сервера
     */
    async logout(): Promise<AuthResponse> {
        return handleFetch<AuthResponse>(this.baseURL, '/logout', { method: 'POST' });
    }
}

export default new AuthApi(API_URL);
