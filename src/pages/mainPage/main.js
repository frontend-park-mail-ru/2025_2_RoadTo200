import Card from '../../components/Card/card.js';
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

/**
 * Отправляет действие пользователя (лайк/дизлайк/суперлайк) на сервер.
 * @param {string} cardId ID карточки над которой выполнено действие.
 * @param {'like' | 'dislike' | 'superlike'} actionType Тип действия.
 * @returns {Promise<void>}
 */
const sendActionToServer = async (cardId, actionType) => {
    const res = await cardApi.postCardAction(cardId, actionType);
};

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
        // const response = await fetch(API_URL, {
        //     credentials: 'include', // Включаем куки
        //     headers: AuthUtils.getAuthHeaders()
        // });
        // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        // const apiData = await response.json();

        const apiData = await cardApi.getAllCards();
        
        cardsData = Object.values(apiData); 
        currentCardIndex = 0;

        const initialCard = cardsData.length > 0 ? cardsData[currentCardIndex] : null;

        return {
            cards: initialCard ? [initialCard] : []
        };
    },

    renderNextCard: async () => {
        
        currentCardIndex++;

        if (currentCardIndex < cardsData.length) {
            const nextCardData = cardsData[currentCardIndex];
            
            const cardHtml = await Card.render(nextCardData);
            if (pageContainer) {
                pageContainer.insertAdjacentHTML('beforeend', cardHtml); 
                mainPage.initCardActions(); 
            }
        } else if (pageContainer) {
                const cardHtml = await Card.render({img1: './src/assets/image.png', noActions: 'True'});
                pageContainer.insertAdjacentHTML('beforeend', cardHtml);
            }
    },

    initCardActions: () => {
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
                
                sendActionToServer(cardId, actionType);

                animateCardOut(currentCardElement, direction); 
            };

            const actionButtons = currentCardElement.querySelectorAll('.card-actions button');
            actionButtons.forEach(button => {
                button.removeEventListener('click', handleAction); 
                button.addEventListener('click', handleAction);
            });
        }
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
                    mainPage.initCardActions(); 
                }
            }, 0); 
        }

        return renderedHtml;
    }
};

export default mainPage;