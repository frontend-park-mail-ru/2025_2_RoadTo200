import './src/pages/loginPage/loginStore';
import './src/pages/mainPage/mainStore';
import './src/pages/homePage/homeStore';
import './src/pages/registerPage/registerStore';
import './src/pages/matchesPage/matchesStore';
import './src/pages/matchProfilePage/matchProfileStore';
import './src/pages/profilePage/profileStore';
import './src/pages/settingsPage/settingsStore';
import './src/components/Header/headerStore';
import './src/components/Menu/menuStore';
import './src/components/AuthBackground/authBackgroundStore';
import './src/components/MatchCard/matchCardStore';
import './src/components/ProfileMenu/profileMenuStore';
import './src/components/OfflineBanner/offlineBannerStore';
import navigationStore, { Route } from './src/navigation/navigationStore';

import { Router } from "./router";
import { home } from "./src/pages/homePage/home";
import { main } from "./src/pages/mainPage/main";
import { login } from "./src/pages/loginPage/login";
import { register } from "./src/pages/registerPage/register";
import { matches } from "./src/pages/matchesPage/matches";
import { profile } from "./src/pages/profilePage/profile";
import { settings } from "./src/pages/settingsPage/settings";
import type { PageComponent } from './src/navigation/navigationStore';

const notFoundComponent: PageComponent = {
    parent: null,
    render: () => {
        if (notFoundComponent.parent) {
            notFoundComponent.parent.innerHTML = `
                <div class="page">
                    <h1>404</h1>
                    <a href="/" Link>← Вернуться на главную</a>
                </div>
            `;
        }
    }
};

const routes: Route[] = [
    new Route('/', home, true),
    new Route('/cards', main, true),
    new Route('/login', login, false),
    new Route('/register', register, false),
    new Route('/matches', matches, true),
    new Route('/me', profile, true),
    new Route('/settings', settings, true),
    new Route('*', notFoundComponent, false)
];

// Инициализируем роутер с navigationStore
const router = new Router(routes, navigationStore);

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Сначала удаляем все старые service workers
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log('Old Service Worker unregistered');
            }
            
            // Регистрируем новый Service Worker
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            console.log('Service Worker registered successfully:', registration.scope);
            
            // Проверка обновлений Service Worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('New Service Worker found');
                
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New Service Worker available');
                            // Автоматически активируем новый service worker
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}

export default router;
