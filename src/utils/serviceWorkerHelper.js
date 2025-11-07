/**
 * Утилита для работы с Service Worker
 */

class ServiceWorkerHelper {
    constructor() {
        this.registration = null;
    }

    /**
     * Проверка поддержки Service Worker
     */
    isSupported() {
        return 'serviceWorker' in navigator;
    }

    /**
     * Получение активного Service Worker
     */
    getRegistration() {
        return this.registration;
    }

    /**
     * Очистка всего кеша
     */
    async clearCache() {
        if (!this.isSupported() || !navigator.serviceWorker.controller) {
            console.warn('Service Worker not available');
            return false;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            navigator.serviceWorker.controller.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Обновление кеша профиля
     */
    updateProfileCache() {
        if (!this.isSupported() || !navigator.serviceWorker.controller) {
            return;
        }

        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_PROFILE_CACHE'
        });
    }

    /**
     * Обновление кеша матчей
     */
    updateMatchesCache() {
        if (!this.isSupported() || !navigator.serviceWorker.controller) {
            return;
        }

        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_MATCHES_CACHE'
        });
    }

    /**
     * Проверка онлайн статуса
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * Добавление обработчиков онлайн/офлайн событий
     */
    addConnectivityListeners(onOnline, onOffline) {
        window.addEventListener('online', () => {
            console.log('App is online');
            if (onOnline) onOnline();
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            if (onOffline) onOffline();
        });
    }

    /**
     * Обновление Service Worker
     */
    async updateServiceWorker() {
        if (!this.registration) {
            console.warn('No registration available');
            return;
        }

        try {
            await this.registration.update();
            console.log('Service Worker update check completed');
        } catch (error) {
            console.error('Service Worker update failed:', error);
        }
    }

    /**
     * Принудительная активация нового Service Worker
     */
    skipWaiting() {
        if (!this.isSupported() || !navigator.serviceWorker.controller) {
            return;
        }

        navigator.serviceWorker.controller.postMessage({
            type: 'SKIP_WAITING'
        });
    }
}

export default new ServiceWorkerHelper();
