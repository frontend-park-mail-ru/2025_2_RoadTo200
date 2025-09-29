import { AuthUtils } from '../../utils/auth.js';
import AuthApi from '../../apiHandler/authApi.js';
import SmallHeart from '../SmallHeart/smallHeart.js';

const TEMPLATE_PATH = './src/components/Header/header.hbs';

/**
 * Загрузка шаблона.
 * @param {string} path Путь до шаблона.
 * @returns {Promise<string>} Шаблон в виде строки.
 */
const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон хедера');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона хедера:', error);
        return '<header class="app-header"><div class="header-content"><h1>RoadTo200</h1></div></header>';
    }
};

/**
 * Объект хедера.
 * @property {function(boolean=): Promise<string>} render
 * @property {function(): void} initEventListeners
 */
const Header = {

    /**
     * Отрисовывает компонент хедера.
     * @param {boolean} [isAuthenticated] Флаг, указывающий, авторизован ли пользователь.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async (isAuthenticated = false) => {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        
        let userName = '';
        if (isAuthenticated) {
            try {
                const userInfo = await AuthApi.checkAuth();
                userName = userInfo.user?.email;
            } catch (error) {
                console.error('Ошибка получения данных пользователя:', error);
                userName = 'Пользователь';
            }
        }
        
        // Рендерим маленькое сердце
        const smallHeartHtml = await SmallHeart.render();
        
        return template({ isAuthenticated, userName, smallHeartHtml });
    },

    /**
     * Инициализирует обработчики событий.
     * @returns {void}
     */
    initEventListeners: () => {
        if (typeof window !== 'undefined') {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        await AuthUtils.logout();
                        window.history.pushState(null, null, '/login');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    } catch (error) {
                        console.error('Ошибка при выходе:', error);
                    }
                });
            }
        }
    }
};

export default Header;