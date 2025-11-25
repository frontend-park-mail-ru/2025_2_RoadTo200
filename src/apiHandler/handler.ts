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
    isFormData?: boolean;
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
    const isFormData =
        options.isFormData ??
        (typeof FormData !== 'undefined' && options.body instanceof FormData);
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
            let errorMessage = 'Произошла ошибка';

            // Приоритет: сообщение от сервера, затем стандартные сообщения для статусов
            if (errorDetails && errorDetails.error) {
                errorMessage = errorDetails.error;
            } else if (response.status === 401) {
                errorMessage = 'Неверный email или пароль';
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

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        // Многие эндпоинты (например, POST /profile) отвечают 204 или пустым телом
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return undefined as T;
        }

        const rawBody = await response.text();
        if (!rawBody.trim()) {
            return undefined as T;
        }

        if (isJson) {
            try {
                return JSON.parse(rawBody) as T;
            } catch (parseError) {
                console.error('handleFetch: failed to parse JSON', parseError);
                throw new Error('Некорректный ответ сервера');
            }
        }

        return rawBody as unknown as T;
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
