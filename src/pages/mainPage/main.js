import Card from '../../components/Card/card.js';

import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';


const TEMPLATE_PATH = '/src/pages/mainPage/main.hbs';
const EMPTY_STATE_TEMPLATE_PATH = '/src/components/EmptyState/emptyState.hbs'; 

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
        this.swipeThreshold = 100;
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

        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('card__image')) {
                Card.handleImageNavigation(event);
            }
        });

        dispatcher.process({ type: Actions.GET_CARDS });
    }

    setCards(cards) {
        console.log(cards)
        this.cardsData = Object.values(cards);
        this.currentCardIndex = 0;

        if (this.cardsData.length > 0) {
            this.displayFirstCard();
        } else {
            this.displayEmptyState();
        }
    }

    async displayEmptyState() {
        const pageContainer = document.querySelector('.cards-container');
        if (!pageContainer) return;

        const emptyStateTemplateString = await fetchTemplate(EMPTY_STATE_TEMPLATE_PATH);
        const emptyStateTemplate = Handlebars.compile(emptyStateTemplateString);

        const emptyStateHtml = emptyStateTemplate({
            icon: '❤️',
            title: 'Анкеты закончились',
            message: 'Вы посмотрели все доступные анкеты. Попробуйте изменить фильтры в настройках.',
            buttonText: 'Перейти в настройки',
            buttonId: 'goToSettings'
        });

        pageContainer.innerHTML = emptyStateHtml;

        const settingsButton = document.getElementById('goToSettings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                window.history.pushState({ route: 'settings' }, null, '/settings');
                window.dispatchEvent(new PopStateEvent('popstate'));
            });
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
            this.displayEmptyState();
        }
    }

    initSwipe(cardElement, cardId) {
        let startX, startY, endX, endY;
        let isDragging = false;

        const startSwipe = (e) => {
            isDragging = true;
            
            const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
            const pageY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;
            
            startX = pageX;
            startY = pageY;
            endX = pageX;
            endY = pageY;

            
            e.preventDefault();
        };

        const moveSwipe = (e) => {
            if (!isDragging) return;

            const pageX = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
            const pageY = e.type.includes('touch') ? e.touches[0].pageY : e.pageY;

            endX = pageX;
            endY = pageY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            cardElement.style.transform = `translate(${deltaX - 200}px, ${deltaY}px) rotate(${deltaX * 0.1}deg)`;
            
        };

        const stopSwipe = () => {
            if (!isDragging) return;
            isDragging = false;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            let direction = '';
            let actionType = '';

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
      
                if (deltaX > 0) {
                    direction = 'right';
                    actionType = 'like';
                } else {
                    direction = 'left';
                    actionType = 'dislike';
                }
            } else if (deltaY < 0 && Math.abs(deltaY) > this.swipeThreshold) {
                direction = 'up';
                actionType = 'super_like';
            }

            if (direction && actionType) {
                dispatcher.process({ 
                    type: Actions.SEND_CARD_ACTION, 
                    payload: { cardId, actionType } 
                });

                animateCardOut(cardElement, direction);
            } else {
                cardElement.style.transform = 'translate(-220px, 0) rotate(0deg)';
            }
        };

        cardElement.addEventListener('mousedown', startSwipe);
        cardElement.addEventListener('mousemove', moveSwipe);
        cardElement.addEventListener('mouseup', stopSwipe);

    }

    initCardActions() {
        const pageContainer = document.querySelector('.cards-container');
        const currentCardElement = pageContainer?.querySelector('.card:last-child');

        if (currentCardElement) {
            const cardId = currentCardElement.getAttribute('data-id');

            this.initSwipe(currentCardElement, cardId);

            const handleAction = async (event) => {
                const button = event.currentTarget;
                let direction = '';
                let actionType = '';

                if (button.classList.contains('card__button-dislike')) {
                    direction = 'left';
                    actionType = 'dislike';
                } else if (button.classList.contains('card__button-like')) {
                    direction = 'right';
                    actionType = 'like';
                } else if (button.classList.contains('card__button-superLike')) {
                    direction = 'up';
                    actionType = 'super_like';
                } else {
                    return;
                }

                dispatcher.process({ 
                    type: Actions.SEND_CARD_ACTION, 
                    payload: { cardId, actionType } 
                });

                animateCardOut(currentCardElement, direction);
            };

            const actionButtons = currentCardElement.querySelectorAll('button');
            actionButtons.forEach(button => {
                button.removeEventListener('click', handleAction);
                button.addEventListener('click', handleAction);
            });
        }
    }
}

const rootElement = document.getElementById('root');
export const main = new MainPage(rootElement);