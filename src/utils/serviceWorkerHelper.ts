/**
 * Утилита для работы с Service Worker
 */
class ServiceWorkerHelper {
    private registration: ServiceWorkerRegistration | null = null;

    /**
     * Проверка поддержки Service Worker
     */
    isSupported(): boolean {
        return 'serviceWorker' in navigator;
    }

    /**
     * Получение активного Service Worker
     */
    getRegistration(): ServiceWorkerRegistration | null {
        return this.registration;
    }

    /**
     * Очистка всего кеша
     */
    async clearCache(): Promise<boolean> {
        if (!this.isSupported() || !navigator.serviceWorker.controller) {
            // console.warn('Service Worker not available');
            return false;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event: MessageEvent) => {
                resolve(event.data.success as boolean);
            };

            const controller = navigator.serviceWorker.controller;
            if (controller) {
                controller.postMessage(
                    { type: 'CLEAR_CACHE' },
                    [messageChannel.port2]
                );
            }
        });
    }

    /**
     * Обновление кеша профиля
     */
    updateProfileCache(): void {
        const controller = navigator.serviceWorker?.controller;
        if (!this.isSupported() || !controller) {
            return;
        }

        controller.postMessage({
            type: 'UPDATE_PROFILE_CACHE'
        });
    }

    /**
     * Обновление кеша матчей
     */
    updateMatchesCache(): void {
        const controller = navigator.serviceWorker?.controller;
        if (!this.isSupported() || !controller) {
            return;
        }

        controller.postMessage({
            type: 'UPDATE_MATCHES_CACHE'
        });
    }

    /**
     * Проверка онлайн статуса
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Добавление обработчиков онлайн/офлайн событий
     */
    addConnectivityListeners(onOnline?: () => void, onOffline?: () => void): void {
        window.addEventListener('online', () => {
            // console.log('App is online');
            if (onOnline) onOnline();
        });

        window.addEventListener('offline', () => {
            // console.log('App is offline');
            if (onOffline) onOffline();
        });
    }

    /**
     * Обновление Service Worker
     */
    async updateServiceWorker(): Promise<void> {
        if (!this.registration) {
            // console.warn('No registration available');
            return;
        }

        try {
            await this.registration.update();
            // console.log('Service Worker update check completed');
        } catch (error) {
            // console.error('Service Worker update failed:', error);
        }
    }

    /**
     * Принудительная активация нового Service Worker
     */
    skipWaiting(): void {
        const controller = navigator.serviceWorker?.controller;
        if (!this.isSupported() || !controller) {
            return;
        }

        controller.postMessage({
            type: 'SKIP_WAITING'
        });
    }

    /**
     * Установка регистрации Service Worker
     */
    setRegistration(registration: ServiceWorkerRegistration): void {
        this.registration = registration;
    }
}

export default new ServiceWorkerHelper();
