import { header } from './src/components/Header/header';
import { menu } from './src/components/Menu/menu';
import { profileMenu } from './src/components/ProfileMenu/profileMenu';
import { offlineBanner } from './src/components/OfflineBanner/offlineBanner';

import { dispatcher } from './src/Dispatcher';
import { Actions } from './src/actions';

import type { Route } from './src/navigation/navigationStore';
import type navigationStore from './src/navigation/navigationStore';

// Импортируем все stores для регистрации в dispatcher
import './src/pages/loginPage/loginStore';
import './src/pages/registerPage/registerStore';
import './src/pages/mainPage/mainStore';
import './src/components/Header/headerStore';
import './src/components/AuthBackground/authBackgroundStore';
import './src/components/SettingsMenu/settingsMenuStore';
import './src/components/OfflineBanner/offlineBannerStore';

/**
 * Класс Router для инициализации навигации и глобальных компонентов
 */
export class Router {
    constructor(routes: Route[], navigationStoreInstance: typeof navigationStore) {
        const rootElement = document.getElementById('root');
        
        if (!rootElement) {
            throw new Error('Root element not found');
        }
        
        // Инициализируем navigationStore с маршрутами
        navigationStoreInstance.init(routes, rootElement);
        
        // Получаем контейнеры из store
        const containers = navigationStoreInstance.getContainers();
        
        // Устанавливаем parent для глобальных компонентов
        header.parent = containers.header;
        menu.parent = containers.menu;
        profileMenu.parent = containers.profileMenu;
        offlineBanner.parent = containers.offlineBanner;
        
        // Рендерим глобальные компоненты
        Promise.resolve().then(() => {
            dispatcher.process({ type: Actions.RENDER_HEADER });
            dispatcher.process({ type: Actions.RENDER_PROFILE_MENU });
            dispatcher.process({ type: Actions.RENDER_OFFLINE_BANNER });
        });
    }
}
