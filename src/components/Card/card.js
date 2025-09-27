const CARD_TEMPLATE_PATH = './src/components/Card/card.hbs';

const fetchCardTemplate = async () => {
    const response = await fetch(CARD_TEMPLATE_PATH);
    if (!response.ok) throw new Error(`Ошибка: Не удалось загрузить шаблон`);
    return await response.text();
};

const Card = {
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
