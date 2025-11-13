export interface ErrorResponse {
    error: string;
    status?: number;
    details?: unknown;
}

export interface OfflineResponse extends ErrorResponse {
    error: 'Offline';
    cachedData?: unknown;
}

export interface FetchError extends Error {
    status?: number;
    details?: unknown;
    isOffline?: boolean;
    isNetworkError?: boolean;
    cachedData?: unknown;
}

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Вспомогательная функция отправляющая запрос
 * @param baseURL Базовый URL сервера
 * @param endpoint Относительный путь
 * @param options Настройки запроса
 * @returns Ответ сервера
 */
export async function handleFetch<T = unknown>(
    baseURL: string,
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const url = `${baseURL}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const fetchOptions: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            // Проверка на offline режим (503 от Service Worker)
            if (response.status === 503) {
                const data = (await response.json()) as OfflineResponse;
                if (data.error === 'Offline') {
                    const error = new Error(
                        data.error || 'Данные недоступны в offline режиме'
                    ) as FetchError;
                    error.status = 503;
                    error.isOffline = true;
                    error.cachedData = data;
                    throw error;
                }
            }

            let errorDetails: ErrorResponse | null = null;
            try {
                errorDetails = (await response.json()) as ErrorResponse;
            } catch (e) {
                // Игнорируем, если не JSON
            }

            // Формируем понятное сообщение об ошибке
            let errorMessage = 'Неверный email или пароль';
            if (errorDetails && errorDetails.error) {
                errorMessage = errorDetails.error;
            } else if (response.status === 500) {
                errorMessage = 'Ошибка сервера. Попробуйте позже';
            } else if (response.status === 404) {
                errorMessage = 'Сервис недоступен';
            }

            const error = new Error(errorMessage) as FetchError;
            error.status = response.status;
            error.details = errorDetails;
            throw error;
        }

        return response.json() as Promise<T>;
    } catch (error) {
        const fetchError = error as FetchError;
        if (fetchError.name === 'TypeError' && !navigator.onLine) {
            fetchError.message = 'Нет подключения к интернету';
            fetchError.isNetworkError = true;
            fetchError.isOffline = true;
        } else if (fetchError.name === 'TypeError') {
            fetchError.message = 'Ошибка соединения с сервером';
            fetchError.isNetworkError = true;
        }
        throw fetchError;
    }
}

export default handleFetch;
