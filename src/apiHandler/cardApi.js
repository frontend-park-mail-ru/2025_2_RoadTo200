import handleFetch from './handler.js';


const API_URL = 'http://127.0.0.1:3000/api'

class CardApi { 
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    // /**
    //  * Вспомогательный метод для получения токена аутентификации.
    //  * @returns {string|null} Токен или null, если не найден.
    //  */
    // _getAuthToken() {
    //     return localStorage.getItem('authToken'); 
    // }

    /**
     * Вспомогательная функция добавляющая токен аутентификации и отправляющая запрос
     * @param {string} endpoint Относительный путь.
     * @param {Object} options Настройки запроса.
     * @returns {Promise<Response>} Ответ сервера.
     */
    async handleFetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers 
        };

        const fetchOptions = {
            ...options,
            headers: headers,
            credentials: 'include'
        }; 

        try { 
            const response = await fetch(url, fetchOptions); 

            if (!response.ok){
                throw new Error(`Request failed with status ${response.status}`);
            }

            return response.json();
        }
        catch(error) {
            throw error;
        }
    }

    /**
     * GET /cards/
     * Получить все карточек
     * @returns {Promise<Object>} Объект с данными всех карточек.
     */
    async getAllCards() {
        return this.handleFetch('/cards/', { method: 'GET' });
    }

    /**
     * GET /cards/:cardId
     * Получить данные конкретной карточки
     * @param {string} cardId - ID карточки
     * @returns {Promise<Object>} Объект с данными карточки.
     */
    async getCardById(cardId) {
        return this.handleFetch(`/cards/${cardId}`, { method: 'GET' });
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
        
        return this.handleFetch('/cards/action', options);
    }

}


export default new CardApi(API_URL);