const CARD_TEMPLATE_PATH = './src/components/Card/card.hbs';

/**
 * Загрузка шаблона
 * @param {string} path путь до шаблона
 * @returns {Promise<string>} шаблон в виде строки
 */
const fetchCardTemplate = async () => {
    const response = await fetch(CARD_TEMPLATE_PATH);
    if (!response.ok) {
        console.error('Ошибка: Не удалось загрузить шаблон');
    }
    return await response.text();
};

/**
 * Объект карточки.
 */
const Card = {

    /**
     * Обработка клика по изображению для навигации
     * @param {MouseEvent} event
     */
    handleImageNavigation(event) {
        const target = event.target;
        const cardElement = target.closest('.card');
        const imagesJson = cardElement.getAttribute('data-images-json');

        let images;

        try {
            images = JSON.parse(imagesJson);
        } catch (err) {
            return;
        }

        let currentIndex = parseInt(cardElement.getAttribute('data-current-image-index') || 0, 10);

        const rect = target.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;

        let newIndex = currentIndex;
        if (clickX < width / 2) {
            newIndex = (currentIndex - 1 + images.length) % images.length;
        } else {
            newIndex = (currentIndex + 1) % images.length;
        }

        if (newIndex !== currentIndex) {
            target.src = images[newIndex];
            cardElement.setAttribute('data-current-image-index', newIndex);
        }
    },

    /**
     * Отрисовывает компонент.
     * @param {Object} cardData Данные для заполнения карточки.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async (cardData) => {
        if (typeof Handlebars === 'undefined') {
            console.error('Handlebars is not loaded');
            return '<div>Ошибка: Не удалось загрузить хенделбарс</div>';
        }

        const templateData = {
            ...cardData,
            imagesJson: JSON.stringify(cardData.images.map(img => img.imageUrl)),
        };

        const templateString = await fetchCardTemplate();
        const template = Handlebars.compile(templateString);

        return template(templateData);
    },

    /**
     * Инициализация карточки
     * @param {HTMLElement} cardElement
     */
    init: (cardElement) => {
        console.log('Initializing card:', cardElement);
        cardElement.addEventListener('click', Card.handleImageNavigation);
    }
};

export default Card;
