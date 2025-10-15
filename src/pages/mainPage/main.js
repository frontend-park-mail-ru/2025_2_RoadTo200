import Card from '../../components/Card/card.js';

import CardStore from '../../flux/card/cardStore.js';
import CardActions from '../../flux/card/cardActions.js';

import { AuthUtils } from '../../utils/auth.js';

import cardApi from '../../apiHandler/cardApi.js';

const TEMPLATE_PATH = './src/pages/mainPage/main.hbs'; 

let cardsData = []; 
let currentCardIndex = 0; 
let pageContainer = null;

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

let currentDisplayedIndex = 0;

const animateCardOut = (cardElement, direction) => {
    cardElement.classList.add(`swipe-out-${direction}`); 

    cardElement.addEventListener('animationend', () => {
        cardElement.remove();
        mainPage.renderNextCard(); 
    }, { once: true }); 
};

/**
 * Объект главной страницы (ленты карточек).
 * @property {function(): Promise<Object>} getData
 * @property {function(): Promise<void>} renderNextCard
 * @property {function(): void} initCardActions
 * @property {function(): Promise<string>} render
 */
const mainPage = {
    getData: async () => {
        await CardActions.getAllCards();
        const state = CardStore.getState();
        
        if (state.error) {
            console.error('Ошибка при получении карточек:', state.error);
            return { cards: [] };
        }
        
        return {
            cards: state.cards.length > 0 ? [state.cards[0]] : []
        };
    },

    renderNextCard: async () => {
        const state = CardStore.getState();
        const pageContainer = document.querySelector('.cards-container');
        
        if (!pageContainer || state.cards.length === 0) return;
        
        currentDisplayedIndex++;
        
        if (currentDisplayedIndex < state.cards.length) {
            const nextCardData = state.cards[currentDisplayedIndex];
            const cardHtml = await Card.render(nextCardData);
            pageContainer.insertAdjacentHTML('beforeend', cardHtml);
            mainPage.initCardActions();
        } else {
            const cardHtml = await Card.render({
                img1: './src/assets/image.png',
                noActions: 'True'
            });
            pageContainer.insertAdjacentHTML('beforeend', cardHtml);
        }
    },

    initCardActions: () => {
        const pageContainer = document.querySelector('.cards-container');
        const currentCardElement = pageContainer?.querySelector('.card');

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
                
                CardActions.swipeCard(cardId, actionType);

                animateCardOut(currentCardElement, direction);
            };

            const actionButtons = currentCardElement.querySelectorAll('.card-actions button');
            actionButtons.forEach(button => {
                button.removeEventListener('click', handleAction); 
                button.addEventListener('click', handleAction);
            });
        }
    },

    onStoreChange: (state) => {
        if (state.error) {
            console.error('mainPage: Error:', state.error);
        }
    },

     subscribe: () => {
        CardStore.addSub(mainPage.onStoreChange);
    },

    unsubscribe: () => {
        CardStore.removeSub(mainPage.onStoreChange);
    },
    
    render: async () => {
        const [pageData, pageTemplateString] = await Promise.all([
            mainPage.getData(), 
            fetchTemplate(TEMPLATE_PATH)
        ]);

        const cardHtmlArray = await Promise.all(
            pageData.cards.map(card => Card.render(card))
        );
        pageData.cardsHtml = cardHtmlArray.join('');

        const pageTemplate = Handlebars.compile(pageTemplateString);
        const renderedHtml = pageTemplate(pageData);
        
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                pageContainer = document.querySelector('.cards-container');
                if (pageContainer) {
                    mainPage.subscribe();
                    mainPage.initCardActions(); 
                }
            }, 0); 
        }

        return renderedHtml;
    }
};

export default mainPage;