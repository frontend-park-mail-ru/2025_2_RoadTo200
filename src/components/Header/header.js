import { AuthUtils } from '../../utils/auth.js';

const TEMPLATE_PATH = './src/components/Header/header.hbs';

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

const Header = {
    render: async () => {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        return template({});
    },

    initEventListeners: () => {
        if (typeof window !== 'undefined') {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        await AuthUtils.logout();
                        // Перенаправляем на страницу входа
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