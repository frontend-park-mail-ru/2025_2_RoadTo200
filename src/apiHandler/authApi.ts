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
    message?: string;
}

export interface RegisterResponse {
    id: string;
    email: string;
}

export interface LoginResponse {
    id: string;
    email: string;
}

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
}

export interface CheckAuthResponse {
    authenticated: boolean;
    user?: SessionUser;
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
    async register(
        email: string,
        password: string,
        passwordConfirm: string
    ): Promise<RegisterResponse> {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password, passwordConfirm }),
        };
        return handleFetch<RegisterResponse>(this.baseURL, '/register', options);
    }

    /**
     * POST /auth/login - Вход пользователя. Создает сессию
     * @param email Email пользователя
     * @param password Пароль
     * @returns Promise с ответом сервера
     */
    async login(email: string, password: string): Promise<LoginResponse> {
        const options = {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        };
        return handleFetch<LoginResponse>(this.baseURL, '/login', options);
    }

    /**
     * GET /auth/check - Проверка статуса аутентификации
     * @returns Promise с статусом аутентификации
     */
    async checkAuth(): Promise<CheckAuthResponse> {
        return handleFetch<CheckAuthResponse>(this.baseURL, '/session', {
            method: 'GET',
        });
    }

    /**
     * POST /auth/logout - Выход пользователя. Удаляет сессию
     * @returns Promise с ответом сервера
     */
    async logout(): Promise<AuthResponse> {
        return handleFetch<AuthResponse>(this.baseURL, '/logout', {
            method: 'POST',
        });
    }
}

export default new AuthApi(API_URL);
