import Handlebars from 'handlebars';
import Card from '@/components/Card/card';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

const TEMPLATE_PATH = '/src/pages/mainPage/main.hbs';
const EMPTY_STATE_TEMPLATE_PATH = '/src/components/EmptyState/emptyState.hbs'; 

interface CardData {
    id: string;
    name: string;
    age: number;
    description?: string;
    images?: Array<{ imageUrl: string }>;
    photosCount?: number;
}

const fetchTemplate = async (path: string): Promise<string> => {
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

const animateCardOut = (cardElement: HTMLElement, direction: string): void => {
    cardElement.classList.add(`swipe-out-${direction}`); 

    cardElement.addEventListener('animationend', () => {
        cardElement.remove();
        main.renderNextCard(); 
    }, { once: true }); 
};

export class MainPage {
    parent: HTMLElement;
    currentCardIndex: number;
    cardsData: CardData[];
    swipeThreshold: number;

    constructor(parent: HTMLElement) {
        this.parent = parent;
        this.currentCardIndex = 0;
        this.cardsData = [];
        this.swipeThreshold = 100;
    }

    async render(): Promise<void> {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const renderedHtml = pageTemplate({ cardsHtml: '' });

        const newDiv = document.createElement('div');
        newDiv.id = 'mainDiv';
        newDiv.innerHTML = renderedHtml;
        this.parent.appendChild(newDiv);

        document.addEventListener('click', (event: Event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('card__image')) {
                Card.handleImageNavigation(event as MouseEvent);
            }
        });

        await dispatcher.process({ type: Actions.GET_CARDS });
    }

    setCards(cards: CardData[]): void {
        console.log('setCards called with:', cards);
        // Если cards уже массив, используем его напрямую
        this.cardsData = Array.isArray(cards) ? cards : Object.values(cards);
        this.currentCardIndex = 0;

        console.log('Cards data length:', this.cardsData.length);
        if (this.cardsData.length > 0) {
            this.displayFirstCard();
        } else {
            this.displayEmptyState();
        }
    }

    async displayEmptyState(): Promise<void> {
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
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/settings' }
                });
            });
        }
    }

    async displayFirstCard(): Promise<void> {
        const pageContainer = document.querySelector('.cards-container');

        if (!pageContainer) return;

        const firstCardData = this.cardsData[this.currentCardIndex];
        const cardHtml = await Card.render(firstCardData);
        
        pageContainer.insertAdjacentHTML('beforeend', cardHtml);
        this.initCardActions();
        this.currentCardIndex++;
    }

    renderNextCard = async (): Promise<void> => {
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
            await this.displayEmptyState();
        }
    }

    private initSwipe(cardElement: HTMLElement, cardId: string): void {
        let startX: number, startY: number, endX: number, endY: number;
        let isDragging = false;

        const startSwipe = (e: MouseEvent | TouchEvent) => {
            isDragging = true;
            
            const pageX = e.type.includes('touch') ? (e as TouchEvent).touches[0].pageX : (e as MouseEvent).pageX;
            const pageY = e.type.includes('touch') ? (e as TouchEvent).touches[0].pageY : (e as MouseEvent).pageY;
            
            startX = pageX;
            startY = pageY;
            endX = pageX;
            endY = pageY;

            e.preventDefault();
        };

        const moveSwipe = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;

            const pageX = e.type.includes('touch') ? (e as TouchEvent).touches[0].pageX : (e as MouseEvent).pageX;
            const pageY = e.type.includes('touch') ? (e as TouchEvent).touches[0].pageY : (e as MouseEvent).pageY;

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

        cardElement.addEventListener('mousedown', startSwipe as EventListener);
        cardElement.addEventListener('mousemove', moveSwipe as EventListener);
        cardElement.addEventListener('mouseup', stopSwipe);
    }

    private initCardActions(): void {
        const pageContainer = document.querySelector('.cards-container');
        const currentCardElement = pageContainer?.querySelector('.card:last-child') as HTMLElement | null;

        if (currentCardElement) {
            const cardId = currentCardElement.getAttribute('data-id');
            if (!cardId) return;

            this.initSwipe(currentCardElement, cardId);

            const handleAction = async (event: Event) => {
                const button = event.currentTarget as HTMLElement;
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

                await dispatcher.process({ 
                    type: Actions.SEND_CARD_ACTION, 
                    payload: { cardId, actionType } 
                });

                animateCardOut(currentCardElement, direction);
            };

            const actionButtons = currentCardElement.querySelectorAll('button');
            actionButtons.forEach(button => {
                button.removeEventListener('click', handleAction as EventListener);
                button.addEventListener('click', handleAction as EventListener);
            });
        }
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}
export const main = new MainPage(rootElement);
