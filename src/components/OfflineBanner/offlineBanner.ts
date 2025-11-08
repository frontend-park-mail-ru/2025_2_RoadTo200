import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/OfflineBanner/offlineBanner.hbs';

interface BannerData {
    isOnline?: boolean;
}

/**
 * Загрузка шаблона
 */
const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон offline баннера');
        }
        return await response.text();
    } catch (error) {
        // console.error("Ошибка загрузки offline banner:", error);
        return '<div></div>';
    }
};

/**
 * Компонент offline баннера
 */
export class OfflineBanner implements PageComponent {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    /**
     * Отрисовывает компонент offline баннера
     */
    async render(bannerData: BannerData = {}): Promise<void> {
        if (!this.parent) return;

        const { isOnline } = bannerData;
        
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        
        const renderedHtml = template({ isOnline });
        
        this.parent.innerHTML = renderedHtml;
    }

    /**
     * Показывает баннер (убирает класс hidden)
     */
    show(): void {
        if (!this.parent) return;

        const banner = this.parent.querySelector('.offline-banner');
        if (banner) {
            banner.classList.remove('offline-banner--hidden');
        }
    }

    /**
     * Скрывает баннер (добавляет класс hidden)
     */
    hide(): void {
        if (!this.parent) return;

        const banner = this.parent.querySelector('.offline-banner');
        if (banner) {
            banner.classList.add('offline-banner--hidden');
        }
    }
}

export const offlineBanner = new OfflineBanner(document.createElement('div'));
