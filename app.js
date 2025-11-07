import './src/pages/loginPage/loginStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/pages/homePage/homeStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/matchesPage/matchesStore.js';
import './src/pages/matchProfilePage/matchProfileStore.js';
import './src/pages/profilePage/profileStore.js';
import './src/pages/settingsPage/settingsStore.js';
import './src/components/Header/headerStore.js';
import './src/components/Menu/menuStore.js';
import './src/components/AuthBackground/authBackgroundStore.js';
import './src/components/MatchCard/matchCardStore.js';
import './src/components/ProfileMenu/profileMenuStore.js';
import './src/components/OfflineBanner/offlineBannerStore.js';
import navigationStore, { Route } from './src/navigation/navigationStore.js';

import { Router } from "./router.js";
import { home } from "./src/pages/homePage/home.js";
import { main } from "./src/pages/mainPage/main.js";
import { login } from "./src/pages/loginPage/login.js";
import { register } from "./src/pages/registerPage/register.js";
import { matches } from "./src/pages/matchesPage/matches.js";
import { profile } from "./src/pages/profilePage/profile.js";
import { settings } from "./src/pages/settingsPage/settings.js";


const notFoundComponent = {
    render: () => `
      <div class="page">
        <h1>404</h1>
        <a href="/" Link>← Вернуться на главную</a>
      </div>
    `
};


const routes = [
    new Route('/', home, true),
    new Route('/cards', main, true),
    new Route('/login', login, false),
    new Route('/register', register, false),
    new Route('*', notFoundComponent, false),
    new Route('/matches', matches, true),
    new Route('/me', profile, true),
    new Route('/settings', settings, true)
];

// Инициализируем роутер с navigationStore
const router = new Router(routes, navigationStore);

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            console.log('Service Worker registered successfully:', registration.scope);
            
            // Проверка обновлений Service Worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('New Service Worker found');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New Service Worker available');
                        // Можно показать уведомление пользователю об обновлении
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}

export default router;