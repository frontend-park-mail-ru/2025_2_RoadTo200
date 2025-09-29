const CARD_TEMPLATE_PATH = './src/components/Card/card.hbs';

/**
 * Загрузка шаблона
 * @param {string} path путь до шаблона
 * @returns {Promise<string>} шаблон в виде строки
 */
const fetchCardTemplate = async () => {
    const response = await fetch(CARD_TEMPLATE_PATH);
    if (!response.ok) throw new Error(`Ошибка: Не удалось загрузить шаблон`);
    return await response.text();
};

/**
 * Объект карточки. 
 * @property {function(Object): Promise<string>} render
 */
const Card = {
    /**
     * Отрисовывает компонент.
     * @param {Object} cardData Данные для заполнения карточки.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async (cardData) => {
        if (typeof Handlebars === 'undefined') {
            return '<div>Ошибка: Не удалось загрузить хенделбарс</div>';
        }
        const templateString = await fetchCardTemplate();
        const template = Handlebars.compile(templateString);
        return template(cardData);  
    }
};

export default Card;
