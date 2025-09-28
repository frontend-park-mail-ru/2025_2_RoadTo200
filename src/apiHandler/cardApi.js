import handleFetch from './handler.js';
import serverURL from './serverURL.JS';

const API_URL = serverURL + '/api'

class CardApi { 
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }
    
    /**
     * GET /cards/
     * Получить все карточек
     * @returns {Promise<Object>} Объект с данными всех карточек.
     */
    async getAllCards() {
        return handleFetch( this.baseURL, '/cards/', { method: 'GET' });
    }

    /**
     * GET /cards/:cardId
     * Получить данные конкретной карточки
     * @param {string} cardId - ID карточки
     * @returns {Promise<Object>} Объект с данными карточки.
     */
    async getCardById(cardId) {
        return handleFetch( this.baseURL, `/cards/${cardId}`, { method: 'GET' });
    }

    /**
     * POST /cards/action
     * Отправить действие с карточкой
     * @param {string|number} cardId ID карточки
     * @param {string} action Выполненное действие (e.g., 'like', 'dislike')
     * @returns {Promise<Object>} Объект с подтверждением.
     */
    async postCardAction(cardId, action) {
        const timestamp = new Date().toISOString();

        const options = {
            method: 'POST',
            body: JSON.stringify({
                card_id: cardId,
                action: action,
                timestamp: timestamp,
            }),
        };
        
        return handleFetch( this.baseURL, '/cards/action', options);
    }

}


export default new CardApi(API_URL);