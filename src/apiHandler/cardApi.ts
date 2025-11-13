import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api`;

export interface Card {
    id: string | number;
    name: string;
    age: number;
    bio?: string;
    photos: string[];
    interests?: string[];
    musician?: string;
    quote?: string;
    distance?: number;
    workout?: boolean;
    fun?: boolean;
    party?: boolean;
    chill?: boolean;
    love?: boolean;
    relax?: boolean;
    yoga?: boolean;
    friendship?: boolean;
    culture?: boolean;
    cinema?: boolean;
}

export interface CardsResponse {
    cards: Card[];
}

export interface CardResponse {
    card: Card;
}

export type CardAction = 'like' | 'dislike' | 'superlike';

export interface CardInteractionRequest {
    card_id: string | number;
    action: CardAction;
    timestamp: string;
}

export interface CardInteractionResponse {
    success: boolean;
    match?: boolean;
    message?: string;
}

class CardApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * GET /cards/ - Получить все карточки
     * @returns Promise с данными всех карточек
     */
    async getAllCards(): Promise<CardsResponse> {
        return handleFetch<CardsResponse>(this.baseURL, '/feed', {
            method: 'GET',
        });
    }

    /**
     * GET /cards/:cardId - Получить данные конкретной карточки
     * @param cardId ID карточки
     * @returns Promise с данными карточки
     */
    async getCardById(cardId: string | number): Promise<CardResponse> {
        return handleFetch<CardResponse>(this.baseURL, `/feed/${cardId}`, {
            method: 'GET',
        });
    }

    /**
     * POST /cards/action - Отправить действие с карточкой
     * @param cardId ID карточки
     * @param action Выполненное действие (e.g., 'like', 'dislike')
     * @returns Promise с подтверждением
     */
    async postCardInteraction(
        cardId: string | number,
        action: CardAction
    ): Promise<CardInteractionResponse> {
        const timestamp = new Date().toISOString();

        const options = {
            method: 'POST',
            body: JSON.stringify({
                card_id: cardId,
                action,
                timestamp,
            } as CardInteractionRequest),
        };

        return handleFetch<CardInteractionResponse>(
            this.baseURL,
            '/swipe',
            options
        );
    }
}

export default new CardApi(API_URL);
