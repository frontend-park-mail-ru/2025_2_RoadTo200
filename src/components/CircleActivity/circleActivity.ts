interface CircleActivityOptions {
    svgPath?: string;
    size?: number;
    opacity?: number;
    className?: string;
}

export class CircleActivity {
    private svgPath: string;
    private size: number;
    private opacity: number;
    private className: string;
    private element: HTMLElement | null;

    /**
     * @param options - Настройки кружка
     * @param options.svgPath - Путь к SVG файлу
     * @param options.size - Размер кружка (по умолчанию 124)
     * @param options.opacity - Прозрачность (по умолчанию 0.5)
     * @param options.className - Дополнительный CSS класс
     */
    constructor(options: CircleActivityOptions = {}) {
        this.svgPath = options.svgPath || '';
        this.size = options.size || 124;
        this.opacity = options.opacity || 0.5;
        this.className = options.className || '';
        this.element = null;
    }

    /**
     * Создаёт и возвращает DOM элемент кружка
     * @returns {HTMLElement}
     */
    render(): HTMLElement {
        const circle = document.createElement('div');
        circle.className = `circle-activity ${this.className}`.trim();
        
        // Применяем базовые стили
        circle.style.width = `${this.size}px`;
        circle.style.height = `${this.size}px`;
        circle.style.opacity = String(this.opacity);
        
        if (this.svgPath) {
            // Создаём img элемент для SVG
            const img = document.createElement('img');
            img.src = this.svgPath;
            img.alt = 'activity icon';
            img.className = 'circle-activity-icon';
            circle.appendChild(img);
        }
        
        this.element = circle;
        return circle;
    }

    /**
     * Обновляет SVG иконку
     * @param newSvgPath - Новый путь к SVG
     */
    updateSvg(newSvgPath: string): void {
        this.svgPath = newSvgPath;
        if (this.element) {
            const img = this.element.querySelector('.circle-activity-icon') as HTMLImageElement;
            if (img) {
                img.src = newSvgPath;
            }
        }
    }

    /**
     * Устанавливает позицию кружка
     * @param x - Позиция по X
     * @param y - Позиция по Y
     */
    setPosition(x: number, y: number): void {
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
    }

    /**
     * Удаляет кружок из DOM
     */
    destroy(): void {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Получает DOM элемент кружка
     * @returns {HTMLElement|null}
     */
    getElement(): HTMLElement | null {
        return this.element;
    }
}

/**
 * Утилита для получения списка всех доступных SVG иконок
 * @returns {Array<string>} Массив путей к SVG файлам
 */
export function getAvailableSvgIcons(): string[] {
    const basePath = './src/assets/ActivityCircleSVG/';
    return [
        `${basePath}bi_arrow-through-heart.svg`,
        `${basePath}fluent_run-20-regular.svg`,
        `${basePath}healthicons_sad-outline.svg`,
        `${basePath}hugeicons_party.svg`,
        `${basePath}lotus.svg`,
        `${basePath}lucide_tree-palm.svg`,
        `${basePath}material-symbols-light_handshake-outline.svg`,
        `${basePath}ph_film-reel-light.svg`,
        `${basePath}smile.svg`,
        `${basePath}streamline-plump_theater-mask.svg`,
    ];
}

/**
 * Утилита для создания кружка с случайной иконкой
 * @param options - Опции (size, opacity, className)
 * @returns {CircleActivity}
 */
export function createRandomCircle(options: CircleActivityOptions = {}): CircleActivity {
    const icons = getAvailableSvgIcons();
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    return new CircleActivity({
        ...options,
        svgPath: randomIcon,
    });
}
