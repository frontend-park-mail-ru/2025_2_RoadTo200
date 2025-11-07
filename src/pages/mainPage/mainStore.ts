import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { main } from './main';
import CardApi, { type CardsResponse, type Card as ApiCard, type CardAction } from '@/apiHandler/cardApi';

interface TransformedCard {
    id: string;
    name: string;
    age: number;
    description: string;
    images: Array<{ imageUrl: string }>;
    photosCount: number;
}

class MainStore implements Store {
    cards: TransformedCard[];
 
    constructor() {
        this.cards = [];
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MAIN:
            case Actions.RENDER_CARDS:
                await main.render();
                break;

            case Actions.GET_CARDS:
                await this.getCards();
                break;

            case Actions.SEND_CARD_ACTION:
                if (action.payload) {
                    const { cardId, actionType } = action.payload as { cardId: string; actionType: string };
                    await this.sendCardInteraction(cardId, actionType);
                }
                break;

            default:
                break;
        }
    }

    private async getCards(): Promise<void> {
        try {
            const response = await CardApi.getAllCards() as any;

            console.log('API Response:', response);
            
            // API возвращает users, а не cards
            const cards = response.users || response.cards || [];
            
            console.log('Cards to transform:', cards.length);
            
            const transformedCards: TransformedCard[] = cards.map((card: any) => {
                // Получаем фото из photos или images
                const photoUrls = card.photos || card.images || [];
                console.log('Card photos/images:', card.name, photoUrls);
                
                return {
                    id: card.id?.toString() || String(Math.random()),
                    name: card.name || 'Unknown',
                    age: card.age || 0,
                    description: card.bio || card.description || '',
                    images: photoUrls.map((url: string) => ({ imageUrl: url })),
                    photosCount: photoUrls.length
                };
            });
            
            console.log('Transformed cards:', transformedCards);
            
            this.cards = transformedCards;
            main.setCards(transformedCards);
            
        } catch (error) {
            console.error('Error getting cards:', error);
            this.cards = [];
            main.setCards([]);
        }
    }

    private async sendCardInteraction(cardId: string, actionType: string): Promise<void> {
        try {
            // Map 'super_like' to 'superlike' for the API
            const mappedAction: CardAction = actionType === 'super_like' ? 'superlike' : actionType as CardAction;
            await CardApi.postCardInteraction(cardId, mappedAction);
        } catch (error) {
            console.error('Error sending card action:', error);
        }
    }
}

export default new MainStore();

