const CACHE_VERSION = '5';
const CACHE_NAME = `terabithia-v${CACHE_VERSION}`;
const API_CACHE_NAME = `terabithia-api-v${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `terabithia-images-v${CACHE_VERSION}`;

// Определяем режим разработки
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Статические ресурсы для кеширования при установке
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.ts',
    '/router.ts',
    '/index.scss',
    '/forms.scss',
    
    // Компоненты
    '/src/components/Header/header.scss',
    '/src/components/Menu/menu.scss',
    '/src/components/ProfileMenu/profileMenu.scss',
    '/src/components/SmallHeart/smallHeart.scss',
    '/src/components/BigHeart/bigHeart.scss',
    '/src/components/Card/card.scss',
    '/src/components/MatchCard/matchCard.scss',
    '/src/components/CircleActivity/circleActivity.scss',
    '/src/components/EmptyState/emptyState.scss',
    '/src/components/AuthBackground/authBackground.scss',
    
    // Страницы
    '/src/pages/homePage/home.scss',
    '/src/pages/mainPage/main.scss',
    '/src/pages/loginPage/login.scss',
    '/src/pages/registerPage/register.scss',
    '/src/pages/matchesPage/matches.scss',
    '/src/pages/matchProfilePage/matchProfile.scss',
    '/src/pages/profilePage/profile.scss',
    '/src/pages/settingsPage/settings.scss',
    
    // Внешние ресурсы
    'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.7.7/handlebars.min.js'
];

// API эндпоинты для кеширования
const API_CACHE_PATTERNS = [
    /\/api\/profile\/profile$/,
    /\/api\/matches$/,
    /\/api\/matches\/\d+$/,
    /\/api\/feed$/
];

// Паттерны для изображений
const IMAGE_PATTERNS = [
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
    /\/uploads\//,
    /\/assets\//
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    // В dev режиме не кэшируем при установке, чтобы всегда получать свежие файлы
    if (isDevelopment) {
        console.log('[SW] Development mode - skipping initial cache');
        event.waitUntil(self.skipWaiting());
        return;
    }
    
    // В prod кэшируем статические ресурсы при установке
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { credentials: 'same-origin' });
                })).catch((error) => {
                    console.error('[SW] Failed to cache some assets:', error);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name !== CACHE_NAME && 
                               name !== API_CACHE_NAME && 
                               name !== IMAGE_CACHE_NAME;
                    })
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Проверка, является ли запрос API запросом
function isApiRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Проверка, является ли запрос изображением
function isImageRequest(url) {
    return IMAGE_PATTERNS.some(pattern => pattern.test(url));
}

// Проверка, является ли запрос навигацией
function isNavigationRequest(request) {
    return request.mode === 'navigate';
}

// Стратегия Stale While Revalidate для статических ресурсов (в dev режиме)
async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(async (networkResponse) => {
        // Клонируем ПЕРЕД любым использованием
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(cacheName);
            cache.put(request, responseToCache);
        }
        return networkResponse;
    }).catch((error) => {
        console.error('[SW] Fetch failed:', error);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    });
    
    // В dev режиме всегда ждем сеть
    if (isDevelopment) {
        return fetchPromise;
    }
    
    // В prod возвращаем кэш сразу, обновляем в фоне
    return cachedResponse || fetchPromise;
}

// Стратегия Network First для API запросов (профиль, матчи)
async function networkFirst(request, cacheName = API_CACHE_NAME) {
    try {
        const networkResponse = await fetch(request);
        
        // Кэшируем только GET запросы с успешным ответом, клонируем ПЕРЕД использованием
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(cacheName);
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Если это запрос профиля или матчей, возвращаем fallback
        if (request.url.includes('/api/profile/profile')) {
            return new Response(
                JSON.stringify({ 
                    error: 'Offline', 
                    message: 'Профиль недоступен в offline режиме' 
                }), 
                { 
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        if (request.url.includes('/api/matches')) {
            return new Response(
                JSON.stringify({ 
                    error: 'Offline', 
                    message: 'Матчи недоступны в offline режиме',
                    matches: []
                }), 
                { 
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        throw error;
    }
}

// Стратегия Cache First для изображений с длительным TTL
async function cacheFirstImages(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(IMAGE_CACHE_NAME);
            cache.put(request, responseToCache);
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Image fetch failed:', error);
        
        // Возвращаем placeholder для изображений
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Можно вернуть placeholder изображение
        return new Response('', { 
            status: 503,
            statusText: 'Service Unavailable' 
        });
    }
}

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;
    
    // Игнорируем chrome-extension и другие схемы
    if (!url.startsWith('http')) {
        return;
    }
    
    // Игнорируем WebSocket запросы Vite HMR
    if (url.includes('?token=') || url.includes('/@vite') || url.includes('/@fs')) {
        return;
    }
    
    // НЕ кэшируем POST, PUT, DELETE запросы - пропускаем их напрямую
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }
    
    // Обработка навигационных запросов
    if (isNavigationRequest(request)) {
        event.respondWith(
            staleWhileRevalidate(request)
                .catch(() => caches.match('/index.html'))
        );
        return;
    }
    
    // Обработка API запросов (профиль и матчи с приоритетом Network First)
    if (isApiRequest(url)) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Обработка изображений (Cache First с длительным хранением)
    if (isImageRequest(url)) {
        event.respondWith(cacheFirstImages(request));
        return;
    }
    
    // Все остальные запросы - Stale While Revalidate в dev, Cache First в prod
    event.respondWith(staleWhileRevalidate(request));
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Очистка кеша по запросу
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            }).then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
    
    // Обновление кеша профиля
    if (event.data && event.data.type === 'UPDATE_PROFILE_CACHE') {
        event.waitUntil(
            caches.open(API_CACHE_NAME).then((cache) => {
                return cache.delete('/api/profile/profile');
            })
        );
    }
    
    // Обновление кеша матчей
    if (event.data && event.data.type === 'UPDATE_MATCHES_CACHE') {
        event.waitUntil(
            caches.open(API_CACHE_NAME).then((cache) => {
                return cache.delete('/api/matches');
            })
        );
    }
});

console.log('[SW] Service Worker loaded');
