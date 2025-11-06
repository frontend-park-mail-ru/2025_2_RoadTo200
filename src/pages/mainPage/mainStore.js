import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { main } from "./main.js"

import CardApi from "../../apiHandler/cardApi.js"

class MainStore {

    cards;
 
    constructor() {
        this.cards = [];
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MAIN:
                await main.render();
                break;

            case Actions.GET_CARDS:
                await this.getCards();
                break;

            case Actions.SEND_CARD_ACTION:
                await this.sendCardInteraction(action.payload.cardId, action.payload.actionType);
                break;

            default:
                break;
        }
    }

    async getCards() {
        
        try {
            const response = await CardApi.getAllCards();

            console.log('API Response:', response);
            
            // Бекенд возвращает { users: [], limit, offset, total }
            // Преобразуем в формат, который ожидает фронтенд
            const cards = response.users || [];
            
            // Преобразуем структуру данных
            const transformedCards = cards.map(user => ({
                id: user.id,
                name: user.name,
                age: user.age,
                description: user.description || '',
                images: user.images ? user.images.map(url => ({ imageUrl: url })) : [],
                photosCount: user.photosCount || 0
            }));
            
            this.cards = transformedCards;
            main.setCards(transformedCards);
            
        } catch (error) {
            console.error('Error getting cards:', error);
            alert("ошибка получения карточек");
        }
    }

    async sendCardInteraction(cardId, actionType) {
        try {
            await CardApi.postCardInteraction(cardId, actionType);
        } catch (error) {
            alert("ошибка отправки реакции");
        }
    }
}

export default new MainStore();