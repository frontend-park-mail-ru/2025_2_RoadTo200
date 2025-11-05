/* global Handlebars */

const TEMPLATE_PATH = '/src/components/BigHeart/bigHeart.hbs';

/**
 * Загрузка шаблона
 * @param {string} path путь до шаблона
 * @returns {Promise<string>} шаблон в виде строки
 */
const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон большого сердца');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона большого сердца:', error);
        return '<aside class="big-heart-container"><div class="heart-big"></div></aside>';
    }
};


/**
 * Объект большое сердце. 
 * @property {function(): Promise<string>} render
 */
const BigHeart = {
    /**
     * Отрисовывает компонент.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async () => {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        return template({});
    }
};

export default BigHeart;