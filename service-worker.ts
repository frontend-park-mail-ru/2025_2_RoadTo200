/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const VERSION = '20';
const CACHE_STATIC = `terabithia-static-v${VERSION}`;
const CACHE_IMAGES = `terabithia-images-v${VERSION}`;
const CACHE_USER_PREFIXES = ['terabithia-api', 'terabithia-images'];

/**
 * Определяем dev-режим
 * В dev-режиме отключаем агрессивное кэширование, чтобы не мешать HMR
 * ВАЖНО: в режиме preview (production build на localhost) IS_DEV должен быть false!
 * Используем наличие service-worker.ts vs service-worker.js как индикатор
 */
const IS_DEV = sw.location.pathname.includes('service-worker.ts');

// Паттерны для определения типа запроса
const PATTERNS = {
    // Все API запросы - НЕ кэшируем в localhost (там работает proxy)
    api: [/\/api\//],
    images: [
        /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
        /\/uploads\//,
        /\/assets\//,
    ],
    hbs: [/\.hbs$/],
    ignore: [/chrome-extension/, /@vite/, /@fs/, /\?token=/],
};

/**
 * Проверяет, соответствует ли URL одному из паттернов
 */
const matchesPattern = (
    url: string,
    patterns: RegExp | RegExp[]
): boolean => {
    const list = Array.isArray(patterns) ? patterns : [patterns];
    return list.some((p) => p.test(url));
};

/**
 * Проверяет, является ли запрос валидным для обработки SW
 * Фильтруем служебные запросы, чтобы не ломать dev-сервер Vite
 */
const isValidRequest = (request: Request): boolean =>
    request.url.startsWith('http') &&
    !matchesPattern(request.url, PATTERNS.ignore);

/**
 * Стратегия Cache First
 * Сначала проверяем кэш, если нет - запрос к сети
 * Идеально для статических ресурсов (изображения, шрифты)
 */
const cacheFirst = async (
    request: Request,
    cacheName: string
): Promise<Response> => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
};

/**
 * Стратегия Network First
 * Сначала пытаемся получить свежие данные из сети, если не получается - берём из кэша
 * Идеально для API-запросов, где важна актуальность
 */
const networkFirst = async (
    request: Request,
    cacheName: string
): Promise<Response> => {
    try {
        const response = await fetch(request);
        if (response && response.status === 200 && request.method === 'GET') {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Network error', { status: 503 });
    }
};

/**
 * Стратегия Stale While Revalidate
 * Отдаём закэшированный ответ сразу, но в фоне обновляем кэш
 */
const staleWhileRevalidate = async (
    request: Request,
    cacheName: string,
    event?: FetchEvent
): Promise<Response> => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
        .then(async (response) => {
            if (response && response.status === 200) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));

    if (IS_DEV) return fetchPromise;

    if (event) event.waitUntil(fetchPromise);
    return cached || fetchPromise;
};

const clearUserCaches = async (): Promise<void> => {
    try {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((key) =>
                    CACHE_USER_PREFIXES.some((prefix) => key.includes(prefix))
                )
                .map((key) => caches.delete(key))
        );
    } catch {
        // ignore cleanup errors
    }
};

/**
 * Событие install - устанавливается новый Service Worker
 * skipWaiting() - немедленно активируем новую версию, не ждём закрытия всех вкладок
 */
sw.addEventListener('install', (event: ExtendableEvent) => {
    sw.skipWaiting();

    // В dev-режиме не кэшируем, чтобы не мешать разработке
    if (IS_DEV) return;

    // Список критичных ресурсов для precaching
    // ВАЖНО: В production Vite добавляет хэши к файлам, поэтому
    // прекэшируем только те ресурсы, которые имеют фиксированные имена
    const precacheResources = [
        '/',
        '/index.html',
    ];

    event.waitUntil(
        caches
            .open(CACHE_STATIC)
            .then((cache) => cache.addAll(precacheResources))
            .catch((err) => {
                console.warn('Precache failed:', err);
            })
    );
});

/**
 * Событие activate - старый SW заменяется новым
 * Удаляем устаревшие кэши и берём контроль над всеми страницами
 */
sw.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith('terabithia-') &&
                                !key.includes(`-v${VERSION}`)
                        )
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => sw.clients.claim())
    );
});

sw.addEventListener('message', (event: ExtendableMessageEvent) => {
    const data = event.data as { type?: string } | null;
    if (!data || typeof data !== 'object') {
        return;
    }

    if (data.type === 'CLEAR_USER_CACHE') {
        event.waitUntil(clearUserCaches());
    }
});

/**
 * Событие fetch - перехватываем все сетевые запросы
 * Применяем разные стратегии кэширования в зависимости от типа запроса
 */
sw.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;

    // Игнорируем невалидные запросы (расширения, служебные модули Vite)
    if (!isValidRequest(request)) return;

    // Только GET-запросы кэшируем
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    const url = request.url;

    // API-запросы:
    // В dev-режиме (service-worker.ts) не кэшируем
    // В production-режиме (service-worker.js) используем Network First
    if (matchesPattern(url, PATTERNS.api)) {
        if (IS_DEV) {
            return;
        }
        event.respondWith(
            (async () => {
                try {
                    return await fetch(request);
                } catch {
                    return new Response(
                        JSON.stringify({ error: 'Offline' }),
                        {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                }
            })()
        );
        return;
    }

    // Изображения: Cache First (быстрая загрузка из кэша)
    if (matchesPattern(url, PATTERNS.images)) {
        event.respondWith(cacheFirst(request, CACHE_IMAGES));
        return;
    }

    // Handlebars шаблоны: Stale While Revalidate (нужны для offline)
    if (matchesPattern(url, PATTERNS.hbs)) {
        event.respondWith(staleWhileRevalidate(request, CACHE_STATIC, event));
        return;
    }

    // Навигация (переход по страницам): Network First с устойчивым fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(request);
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(CACHE_STATIC);
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                } catch {
                    // Пытаемся вернуть закэшированный index.html
                    const cachedIndex = await caches.match('/index.html');
                    if (cachedIndex) return cachedIndex;

                    // Пытаемся найти любую закэшированную версию этого URL
                    const cached = await caches.match(request);
                    if (cached) return cached;

                    // Если и его нет - возвращаем offline-страницу
                    return new Response(
                        `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Офлайн - Terabithia</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .offline-container { max-width: 400px; padding: 2rem; }
        h1 { font-size: 3rem; margin: 0 0 1rem 0; }
        p { font-size: 1.2rem; opacity: 0.9; }
        button {
            margin-top: 2rem;
            padding: 0.8rem 2rem;
            font-size: 1rem;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
        }
        button:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="offline-container">
        <h1>📡</h1>
        <h2>Вы офлайн</h2>
        <p>Проверьте подключение к интернету и попробуйте снова</p>
        <button onclick="location.reload()">Обновить страницу</button>
    </div>
</body>
</html>`,
                        {
                            status: 503,
                            headers: { 'Content-Type': 'text/html; charset=utf-8' }
                        }
                    );
                }
            })()
        );
        return;
    }

    // Остальные запросы (JS, CSS): Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC, event));
});

/**
 * Событие message - обработка команды SKIP_WAITING от app.ts
 */
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
    if (event.data?.type === 'SKIP_WAITING') {
        sw.skipWaiting();
    }
});
