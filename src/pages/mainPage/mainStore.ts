import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { main } from './main';
import CardApi, { type CardsResponse, type Card as ApiCard, type CardAction } from '@/apiHandler/cardApi';
import { ProfileSetupPopup } from '@/components/ProfileSetupPopup/profileSetupPopup';

interface TransformedCard {
    id: string;
    name: string;
    age: number;
    description: string;
    images: Array<{ imageUrl: string }>;
    photosCount: number;
    bio?: string;
    interests?: Array<{ id: number; name: string }>;
    musician?: string;
    quote?: string;
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
                // Проверяем заполненность профиля после рендера
                await this.checkProfileCompleteness();
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

    private async checkProfileCompleteness(): Promise<void> {
        try {
            console.log('Checking profile completeness...');
            const isComplete = await ProfileSetupPopup.isProfileComplete();
            console.log('Profile is complete:', isComplete);
            
            if (!isComplete) {
                // Показываем попап для заполнения профиля
                console.log('Showing profile setup popup...');
                dispatcher.process({ type: Actions.SHOW_PROFILE_SETUP_POPUP });
            } else {
                // Профиль заполнен, загружаем карточки
                console.log('Profile is complete, loading cards...');
                await this.getCards();
            }
        } catch (error) {
            console.error('Error checking profile completeness:', error);
            // В случае ошибки пытаемся загрузить карточки
            await this.getCards();
        }
    }

    private async getCards(): Promise<void> {
        try {
            const response = await CardApi.getAllCards() as any;

            const cards = response.users || response.cards || [];
            
            console.log('Raw cards from backend:', cards);
            console.log('First card detail:', cards[0]);
            
            const mockPhotoUrl = '/src/assets/image.png'; 
            
            const transformedCards: TransformedCard[] = cards.map((card: any) => {
                let photoUrls = card.photos || card.images || [];
                
                if (!Array.isArray(photoUrls)) {
                    photoUrls = []; 
                }

                if (photoUrls.length === 0) {
                    photoUrls.push(mockPhotoUrl);
                }

                // Преобразуем interests если они есть
                let interests: Array<{ id: number; name: string }> | undefined;
                if (card.interests && Array.isArray(card.interests)) {
                    interests = card.interests.map((interest: any, index: number) => ({
                        id: index,
                        name: typeof interest === 'string' ? interest : interest.name || ''
                    }));
                }
                
                return {
                    id: card.id?.toString() || String(Math.random()),
                    name: card.name || 'Unknown',
                    age: card.age || 0,
                    description: card.bio || card.description || '',
                    bio: card.bio || card.description || '',
                    images: photoUrls.map((url: string) => ({ imageUrl: url })),
                    photosCount: photoUrls.length,
                    interests: interests,
                    musician: card.musician || '',
                    quote: card.quote || '',
                    // Передаем все активности
                    workout: card.workout,
                    fun: card.fun,
                    party: card.party,
                    chill: card.chill,
                    love: card.love,
                    relax: card.relax,
                    yoga: card.yoga,
                    friendship: card.friendship,
                    culture: card.culture,
                    cinema: card.cinema
                };
            });

            
            
            this.cards = transformedCards;

            console.log('Transformed cards:', transformedCards);

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

