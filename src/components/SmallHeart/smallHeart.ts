/* global Handlebars */

const TEMPLATE_PATH = '/src/components/SmallHeart/smallHeart.hbs';

/**
 * Загрузка шаблона
 * @param {string} path путь до шаблона
 * @returns {Promise<string>} шаблон в виде строки
 */
const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон маленького сердца');
        }
        return response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона маленького сердца:', error);
        return '<div class="heart-small"></div>';
    }
};

/**
 * Объект малое сердце. 
 * @property {function(): Promise<string>} render
 */
const SmallHeart = {
    /**
     * Отрисовывает компонент.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async (): Promise<string> => {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        return template({});
    }
};

export default SmallHeart;
