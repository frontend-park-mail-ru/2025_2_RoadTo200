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
            const cards = await CardApi.getAllCards();

            console.log(cards)
            
            this.cards = cards;
            main.setCards(cards);
            
        } catch (error) {
            alert("ошибка полученяи карт"); // 
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