import Dispatcher from '../Dispatcher.js';

class CardStore {
    constructor() {
        this.subscribers = [];
        this.cards = [];
        this.currentCard = null;
        this.error = null;
        
        Dispatcher.register(this);
    }

    getState() {
        return {
            cards: this.cards|| [],
            currentCard: this.currentCard,
            error: this.error
        };
    }

    handleAction(action) {
        switch (action.type) {
            case 'GET_ALL_CARDS_SUCCESS':
            case 'GET_CARD_SUCCESS':
                this.cards = action.payload || [];
                this.error = null;
                this.emit();
                break;
            case 'GET_ALL_CARDS_ERROR':
            case 'GET_CARD_ERROR':
                this.error = action.payload;
                this.emit();
                break;

            case 'CARD_SWIPE_SUCCESS':
                this.swipeError = null;
                this.emit();
                break;
            case 'CARD_SWIPE_ERROR':
                this.swipeError = action.payload;
                this.emit();
                break;
        }
    }

    emit() {
        this.subscribers.forEach(cb => cb(this.getState()));
    }

    addSub(view) {
        this.subscribers.push(view);
    }

    removeSub(view) {
        this.subscribers = this.subscribers.filter(cb => cb !== view);
    }
}

export default new CardStore();