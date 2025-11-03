import { Actions } from '../../actions.js';
import { dispatcher } from '../../Dispatcher.js';


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
        alert("загрузка header");
    }
};

/**
 * Объект хедера.
 * @property {function(boolean=): Promise<string>} render
 * @property {function(): void} initEventListeners
 */
export class Header {
    parent;

    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Отрисовывает компонент хедера.
     * @param {boolean} [isAuthenticated] Флаг, указывающий, авторизован ли пользователь.
     * @returns {Promise<string>} HTML код компонента.
     */
    async render(headerData = {}) {
        const { user, isAuthenticated } = headerData;
        
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        
        let userName = '';
        if (isAuthenticated && user && user.email) {
            userName = user.email;
        } else if (isAuthenticated) {
            userName = 'Пользователь';
        }
        
        const renderedHtml = template({ isAuthenticated, userName });
        
        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    /**
     * Инициализирует обработчики событий.
     * @returns {void}
     */
    initEventListeners() {
        if (typeof window !== 'undefined') {
            const logoutBtn = this.parent.querySelector('#logoutBtn');
            
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    dispatcher.process({ type: Actions.REQUEST_LOGOUT });
                }, { once: true });
            }

            // В будущем заменить на иконку профиля
            const userEmailBtn = this.parent.querySelector('#userEmailBtn');
            if (userEmailBtn) {
                userEmailBtn.addEventListener('click', () => {
                    dispatcher.process({ 
                        type: Actions.TOGGLE_PROFILE_MENU,
                        payload: { isVisible: true }
                    });
                });
            }
        }
    }

    /**
     * Обновляет состояние аутентификации без перерисовки хедера.
     * @param {boolean} isAuthenticated Флаг аутентификации.
     * @returns {void}
     */
    updateAuthState(isAuthenticated) {
        // Обновление состояния без полной перерисовки
        // В данном случае хедер уже отрисован и не требует изменений
        if (this.parent) {
            console.log('Header auth state updated:', isAuthenticated);
        }
    }
};

export const header = new Header(document.createElement('div'));
