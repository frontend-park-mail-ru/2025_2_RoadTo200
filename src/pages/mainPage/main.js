import Card from '../../components/Card/card.js';

import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';


const TEMPLATE_PATH = './src/pages/mainPage/main.hbs'; 

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон');
        }

        const templateContent = await response.text();
        
        return templateContent;

    } catch (error) {
        return '<h1>Ошибка: Не удалось загрузить шаблон</h1>'; 
    }
};


const animateCardOut = (cardElement, direction) => {
    cardElement.classList.add(`swipe-out-${direction}`); 

    cardElement.addEventListener('animationend', () => {
        cardElement.remove();
        main.renderNextCard(); 
    }, { once: true }); 
};

/**
 * Объект главной страницы (ленты карточек).
 * @property {function(): Promise<Object>} getData
 * @property {function(): Promise<void>} renderNextCard
 * @property {function(): void} initCardActions
 * @property {function(): Promise<string>} render
 */
export class MainPage {
    parent;
    currentCardIndex;
    cardsData;

    constructor(parent) {
        this.parent = parent;
        this.currentCardIndex = 0;
        this.cardsData = [];
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const renderedHtml = pageTemplate({ cardsHtml: '' });

        const newDiv = document.createElement('div');
        newDiv.id = 'mainDiv';
        newDiv.innerHTML = renderedHtml;
        this.parent.appendChild(newDiv);

        dispatcher.process({ type: Actions.GET_CARDS });
    }

    setCards(cards) {
        console.log(cards)
        this.cardsData = Object.values(cards);
        this.currentCardIndex = 0;

        if (this.cardsData.length > 0) {
            this.displayFirstCard();
        }
    }

    async displayFirstCard() {
        const pageContainer = document.querySelector('.cards-container');

        if (!pageContainer) return;

        const firstCardData = this.cardsData[this.currentCardIndex];
        const cardHtml = await Card.render(firstCardData);
        
        pageContainer.insertAdjacentHTML('beforeend', cardHtml);
        this.initCardActions();
        this.currentCardIndex++;
    }

    renderNextCard = async () => {
        const pageContainer = document.querySelector('.cards-container');

        if (!pageContainer) return;
        console.log(this.currentCardIndex);
        if (this.currentCardIndex < this.cardsData.length) {
            const nextCardData = this.cardsData[this.currentCardIndex];
            const cardHtml = await Card.render(nextCardData);
            pageContainer.insertAdjacentHTML('beforeend', cardHtml);
            this.initCardActions();
            this.currentCardIndex++;
        } else {
            const cardHtml = await Card.render({
                img1: './src/assets/image.png',
                noActions: 'True'
            });
            pageContainer.insertAdjacentHTML('beforeend', cardHtml);
        }
    }

    initCardActions() {
        const pageContainer = document.querySelector('.cards-container');
        const currentCardElement = pageContainer?.querySelector('.card:last-child');

        if (currentCardElement) {
            const cardId = currentCardElement.getAttribute('data-id');

            const handleAction = async (event) => {
                const button = event.currentTarget;
                let direction = '';
                let actionType = '';

                if (button.classList.contains('dislike')) {
                    direction = 'left';
                    actionType = 'dislike';
                } else if (button.classList.contains('like')) {
                    direction = 'right';
                    actionType = 'like';
                } else if (button.classList.contains('superLike')) {
                    direction = 'up';
                    actionType = 'superlike';
                } else {
                    return;
                }

                dispatcher.process({ 
                    type: Actions.SEND_CARD_ACTION, 
                    payload: { cardId, actionType } 
                });

                animateCardOut(currentCardElement, direction);
            };

            const actionButtons = currentCardElement.querySelectorAll('.card-actions button');
            actionButtons.forEach(button => {
                button.removeEventListener('click', handleAction);
                button.addEventListener('click', handleAction);
            });
        }
    }
}

const rootElement = document.getElementById('root');
export const main = new MainPage(rootElement);