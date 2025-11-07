import { header } from './src/components/Header/header.js';
import { menu } from './src/components/Menu/menu.js';
import { profileMenu } from './src/components/ProfileMenu/profileMenu.js';

import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

// Импортируем все stores для регистрации в dispatcher
import './src/pages/loginPage/loginStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/components/Header/headerStore.js';
import './src/components/AuthBackground/authBackgroundStore.js';
import './src/components/SettingsMenu/settingsMenuStore.js';

/**
 * клссс Router для инициализации навигации и глобальных компонентов
 */
export class Router {
    constructor(routes, navigationStore) {
        const rootElement = document.getElementById('root');
        
        // Инициализируем navigationStore с маршрутами
        navigationStore.init(routes, rootElement);
        
        // Получаем контейнеры из store
        const containers = navigationStore.getContainers();
        
        // Устанавливаем parent для глобальных компонентов
        header.parent = containers.header;
        menu.parent = containers.menu;
        profileMenu.parent = containers.profileMenu;
        
        // Рендерим глобальные компоненты
        Promise.resolve().then(() => {
            dispatcher.process({ type: Actions.RENDER_HEADER });
            dispatcher.process({ type: Actions.RENDER_PROFILE_MENU });
        });
    }
}