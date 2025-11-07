/* global Handlebars */

const TEMPLATE_PATH = '/src/components/OfflineBanner/offlineBanner.hbs';

/**
 * Загрузка шаблона.
 * @param {string} path Путь до шаблона.
 * @returns {Promise<string>} Шаблон в виде строки.
 */
const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон offline баннера');
        }
        return await response.text();
    } catch (error) {
        console.error("Ошибка загрузки offline banner:", error);
        return '<div></div>';
    }
};

/**
 * Объект offline баннера.
 */
export class OfflineBanner {
    parent;

    constructor(parent) {
        this.parent = parent;
    }

    /**
     * Отрисовывает компонент offline баннера.
     * @returns {Promise<void>}
     */
    async render(bannerData = {}) {
        const { isOnline } = bannerData;
        
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        
        const renderedHtml = template({ isOnline });
        
        this.parent.innerHTML = renderedHtml;
    }

    /**
     * Показывает баннер (убирает класс hidden).
     */
    show() {
        const banner = this.parent.querySelector('.offline-banner');
        if (banner) {
            banner.classList.remove('offline-banner--hidden');
        }
    }

    /**
     * Скрывает баннер (добавляет класс hidden).
     */
    hide() {
        const banner = this.parent.querySelector('.offline-banner');
        if (banner) {
            banner.classList.add('offline-banner--hidden');
        }
    }
}

export const offlineBanner = new OfflineBanner(document.createElement('div'));
