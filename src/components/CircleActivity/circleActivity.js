/**
 * CircleActivity - компонент для создания кружка с SVG иконкой
 * Можно использовать как отдельно, так и в составе других компонентов
 * 
 * Пример использования:
 * const circle = new CircleActivity({
 *   svgPath: './src/assets/ActivityCircleSVG/smile.svg',
 *   size: 124,
 *   opacity: 0.5
 * });
 * container.appendChild(circle.render());
 */

export class CircleActivity {
    /**
     * @param {Object} options - Настройки кружка
     * @param {string} options.svgPath - Путь к SVG файлу
     * @param {number} options.size - Размер кружка (по умолчанию 124)
     * @param {number} options.opacity - Прозрачность (по умолчанию 0.5)
     * @param {string} options.className - Дополнительный CSS класс
     */
    constructor(options = {}) {
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
    render() {
        const circle = document.createElement('div');
        circle.className = `circle-activity ${this.className}`.trim();
        
        // Применяем базовые стили
        circle.style.width = `${this.size}px`;
        circle.style.height = `${this.size}px`;
        circle.style.opacity = this.opacity;
        
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
     * @param {string} newSvgPath - Новый путь к SVG
     */
    updateSvg(newSvgPath) {
        this.svgPath = newSvgPath;
        if (this.element) {
            const img = this.element.querySelector('.circle-activity-icon');
            if (img) {
                img.src = newSvgPath;
            }
        }
    }

    /**
     * Устанавливает позицию кружка
     * @param {number} x - Позиция по X
     * @param {number} y - Позиция по Y
     */
    setPosition(x, y) {
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
    }

    /**
     * Удаляет кружок из DOM
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Получает DOM элемент кружка
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this.element;
    }
}

/**
 * Утилита для получения списка всех доступных SVG иконок
 * @returns {Array<string>} Массив путей к SVG файлам
 */
export function getAvailableSvgIcons() {
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
 * @param {Object} options - Опции (size, opacity, className)
 * @returns {CircleActivity}
 */
export function createRandomCircle(options = {}) {
    const icons = getAvailableSvgIcons();
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    return new CircleActivity({
        ...options,
        svgPath: randomIcon,
    });
}
