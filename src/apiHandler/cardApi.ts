import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api`;

export interface FeedUser {
    id: string;
    name: string;
    age: number;
    gender: string;
    description: string;
    images: string[];
    photos_count: number;
    artist?: string;
    quote?: string;
    interests?: Array<{ theme: string; user_id: string }>;
    [key: string]: unknown;
}

export interface FeedResponse {
    users: FeedUser[];
    total: number;
    limit: number;
    offset: number;
}

export type CardAction = 'like' | 'dislike' | 'superlike';

export interface CardInteractionRequest {
    card_id: string | number;
    action: CardAction;
    timestamp: string;
}

export interface CardInteractionResponse {
    is_match: boolean;
    match_id?: string;
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
    async getAllCards(
        params: { limit?: number; offset?: number } = {}
    ): Promise<FeedResponse> {
        const query = new URLSearchParams();
        if (params.limit) query.set('limit', params.limit.toString());
        if (params.offset) query.set('offset', params.offset.toString());

        const endpoint = `/feed${query.toString() ? `?${query.toString()}` : ''}`;
        return handleFetch<FeedResponse>(this.baseURL, endpoint, {
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
