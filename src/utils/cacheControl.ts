const USER_CACHE_MARKERS = ['terabithia-api', 'terabithia-images'];
const LOCAL_STORAGE_KEYS = ['selectedActivities'];

const postMessageToSW = (message: unknown): void => {
    if (
        typeof navigator === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !navigator.serviceWorker.controller
    ) {
        return;
    }

    try {
        navigator.serviceWorker.controller.postMessage(message);
    } catch {
        // ignore post message errors
    }
};

export const clearUserCaches = async (): Promise<void> => {
    if (typeof caches !== 'undefined') {
        try {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) =>
                        USER_CACHE_MARKERS.some((marker) =>
                            key.includes(marker)
                        )
                    )
                    .map((key) => caches.delete(key))
            );
        } catch {
            // ignore cache cleanup errors
        }
    }

    postMessageToSW({ type: 'CLEAR_USER_CACHE' });

    if (typeof localStorage !== 'undefined') {
        try {
            LOCAL_STORAGE_KEYS.forEach((key) => {
                localStorage.removeItem(key);
            });
        } catch {
            // ignore localStorage cleanup errors
        }
    }
};
