/* global Handlebars */

import { getActivitiesFromData } from '@/utils/activityIcons';

const CARD_TEMPLATE_PATH = '/src/components/Card/card.hbs';

export interface CardImage {
    imageUrl: string;
}

export interface CardData {
    images?: CardImage[];
    bio?: string;
    interests?: Array<{ id: number; name: string }>;
    musician?: string;
    quote?: string;
    workout?: boolean;
    fun?: boolean;
    party?: boolean;
    chill?: boolean;
    love?: boolean;
    relax?: boolean;
    yoga?: boolean;
    friendship?: boolean;
    culture?: boolean;
    cinema?: boolean;
    [key: string]: any;
}

/**
 * Загрузка шаблона
 * @param {string} path путь до шаблона
 * @returns {Promise<string>} шаблон в виде строки
 */
const fetchCardTemplate = async (): Promise<string> => {
    const response = await fetch(CARD_TEMPLATE_PATH);
    if (!response.ok) {
        // console.error('Ошибка: Не удалось загрузить шаблон');
    }
    return response.text();
};

/**
 * Объект карточки.
 */
const Card = {

    /**
     * Обработка клика по изображению для навигации
     * @param {MouseEvent} event
     */
    handleImageNavigation(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const cardElement = target.closest('.card') as HTMLElement;
        if (!cardElement) return;

        const imagesJson = cardElement.getAttribute('data-images-json');
        if (!imagesJson) return;

        let images: string[];

        try {
            images = JSON.parse(imagesJson);
        } catch {
            return;
        }

        let currentIndex = parseInt(cardElement.getAttribute('data-current-image-index') || '0', 10);

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
            const imgElement = target as HTMLImageElement;
            imgElement.src = images[newIndex];
            cardElement.setAttribute('data-current-image-index', String(newIndex));
        }
    },

    /**
     * Отрисовывает компонент.
     * @param {Object} cardData Данные для заполнения карточки.
     * @returns {Promise<string>} HTML код компонента.
     */
    render: async (cardData: CardData): Promise<string> => {
        if (typeof Handlebars === 'undefined') {
            // console.error('Handlebars is not loaded');
            return '<div>Ошибка: Не удалось загрузить хенделбарс</div>';
        }

        // console.log('Card.render - cardData:', cardData);
        const activities = getActivitiesFromData(cardData);
        // console.log('Card.render - activities:', activities);

        const templateData = {
            ...cardData,
            imagesJson: JSON.stringify((cardData.images || []).map(img => img.imageUrl)),
            activities: activities.length > 0 ? activities : null
        };

        // console.log('Card.render - templateData:', templateData);

        const templateString = await fetchCardTemplate();
        const template = Handlebars.compile(templateString);

        return template(templateData);
    },

    /**
     * Инициализация карточки
     * @param {HTMLElement} cardElement
     */
    init: (cardElement: HTMLElement): void => {
        // console.log('Initializing card:', cardElement);
        cardElement.addEventListener('click', Card.handleImageNavigation);
    }
};

export default Card;