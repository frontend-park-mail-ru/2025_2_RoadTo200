import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';

const TEMPLATE_PATH = '/src/components/Header/header.hbs';

interface HeaderData {
    user: { name?: string; email?: string } | null;
    isAuthenticated: boolean;
}

/**
 * Загрузка шаблона
 * @param path Путь до шаблона
 * @returns Шаблон в виде строки
 */
const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон хедера');
        }
        return await response.text();
    } catch (error) {
        // console.error("Ошибка загрузки header:", error);
        return '<div></div>';
    }
};

/**
 * Компонент хедера
 */
export class Header {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    /**
     * Отрисовывает компонент хедера
     * @param headerData Данные для рендеринга (пользователь, статус авторизации)
     */
    async render(
        headerData: HeaderData = { user: null, isAuthenticated: false }
    ): Promise<void> {
        if (!this.parent) return;

        const { user, isAuthenticated } = headerData;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const baseName =
            user?.name?.trim() ||
            user?.email?.split('@')[0] ||
            'Пользователь';
        const userName =
            baseName.length > 10 ? `${baseName.slice(0, 10)}...` : baseName;

        const renderedHtml = template({ isAuthenticated, userName });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    /**
     * Инициализирует обработчики событий
     */
    private initEventListeners(): void {
        if (typeof window !== 'undefined' && this.parent) {
            const logoutBtn = this.parent.querySelector('#logoutBtn');

            if (logoutBtn) {
                logoutBtn.addEventListener(
                    'click',
                    () => {
                        dispatcher.process({ type: Actions.REQUEST_LOGOUT });
                    },
                    { once: true }
                );
            }

            const userEmailBtn = this.parent.querySelector('#userEmailBtn');
            if (userEmailBtn) {
                userEmailBtn.addEventListener('click', () => {
                    dispatcher.process({
                        type: Actions.TOGGLE_PROFILE_MENU,
                        payload: { isVisible: true },
                    });
                });
            }

            const burgerButton = this.parent.querySelector('#burgerButton');
            if (burgerButton) {
                burgerButton.addEventListener('click', () => {
                    if (typeof document !== 'undefined') {
                        document.body.classList.toggle('menu-open');
                    }
                });
            }
        }
    }

    /**
     * Обновляет состояние аутентификации без перерисовки хедера
     * @param isAuthenticated Флаг аутентификации
     */
    updateAuthState(_isAuthenticated: boolean): void {
        if (this.parent) {
            // console.log('Header auth state updated:', _isAuthenticated);
        }
    }
}

export const header = new Header(document.createElement('div'));
