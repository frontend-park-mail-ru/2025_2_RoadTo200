import CardApi from '../../apiHandler/cardApi.js';

import Dispatcher from '../Dispatcher.js';

class CardActions {

    async getAllCards() {
        console.log('Fetching cards...');
        // console.log(email, password)
        try {
            
            const data = await CardApi.getAllCards();
    
            Dispatcher.process({
                type: 'GET_ALL_CARDS_SUCCESS',
                payload: Object.values(data),
            });
        } catch (error) {
            console.error('Ошибка при получении всех карточек:', error);
            Dispatcher.process({
                type: 'GET_ALL_CARDS_ERROR',
                payload: error
            });
        }
    };

    async swipeCard(cardId, action) {
        try {
            
            Dispatcher.process({
                type: 'CARD_SWIPE_SENT',
                payload: { cardId, action }
            });
            
            const response = await CardApi.postCardAction(cardId, action);
            
            Dispatcher.process({
                type: 'CARD_SWIPE_SUCCESS',
                payload: { cardId, action, response }
            });
        } catch (error) {
            console.error('Ошибка при выполнении свайпа:', error);
            Dispatcher.process({
                type: 'CARD_SWIPE_ERROR',
                payload: { cardId, action, error }
            });
        }
    }
}

export default new CardActions();