import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { main } from './main';
import CardApi, { type FeedUser, type CardAction } from '@/apiHandler/cardApi';
import { ProfileSetupPopup } from '@/components/ProfileSetupPopup/profileSetupPopup';
import headerStore from '@/components/Header/headerStore';
import ProfileApi from '@/apiHandler/profileApi';

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
    isPremium?: boolean;
}

class MainStore implements Store {
    cards: TransformedCard[];
    private premiumCache = new Map<string, boolean>();

    constructor() {
        this.cards = [];
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MAIN:
            case Actions.RENDER_CARDS:
                await main.render();
                await this.checkProfileCompleteness();
                break;
            case Actions.REPORT_SUCCESS:
                if (
                    action.payload &&
                    (action.payload as any).context === 'feed'
                ) {
                    const { targetUserId } = action.payload as {
                        targetUserId: string;
                        context: string;
                    };
                    await this.handleReportFromFeed(targetUserId);
                }
                break;

            case Actions.GET_CARDS:
                await this.getCards();
                break;

            case Actions.SEND_CARD_ACTION:
                if (action.payload) {
                    const { cardId, actionType } = action.payload as {
                        cardId: string;
                        actionType: string;
                    };
                    await this.sendCardInteraction(cardId, actionType);
                }
                break;

            default:
                break;
        }
    }

    private async checkProfileCompleteness(): Promise<void> {
        try {
            const isComplete = await ProfileSetupPopup.isProfileComplete();

            if (!isComplete) {
                dispatcher.process({ type: Actions.SHOW_PROFILE_SETUP_POPUP });
            } else {
                await this.getCards();
            }
        } catch (error) {
            await this.getCards();
        }
    }

    private async getCards(): Promise<void> {
        try {
            const response = await CardApi.getAllCards();
            const cards = response.users || [];

            const mockPhotoUrl = '/src/assets/image.png';

            const transformedCards: TransformedCard[] = cards.map(
                (card: FeedUser, index: number) => {
                    const photoUrls = Array.isArray(card.images)
                        ? card.images.length
                            ? card.images
                            : [mockPhotoUrl]
                        : [mockPhotoUrl];

                    const interests = Array.isArray(card.interests)
                        ? card.interests.map((interest, interestIndex) => ({
                              id: interestIndex,
                              name:
                                  typeof interest === 'string'
                                      ? interest
                                      : interest.theme || 'Интерес',
                          }))
                        : undefined;

                    // Convert interests array to boolean fields for getActivitiesFromData
                    const activityFlags: Record<string, boolean> = {};
                    if (Array.isArray(card.interests)) {
                        card.interests.forEach((interest: any) => {
                            const theme =
                                typeof interest === 'string'
                                    ? interest
                                    : interest.theme;
                            if (theme) {
                                activityFlags[theme] = true;
                            }
                        });
                    }

                    return {
                        id: card.id?.toString() || `card-${index}`,
                        name: card.name || 'Неизвестно',
                        age: card.age || 0,
                        description: card.description || '',
                        bio: card.description || '',
                        images: photoUrls.map((url: string) => ({
                            imageUrl: url,
                        })),
                        photosCount: photoUrls.length,
                        interests,
                        musician: (card as { artist?: string }).artist || '',
                        quote: card.quote || '',
                        isPremium: false,
                        // Set boolean flags from interests array
                        ...activityFlags,
                    };
                }
            );

            if (transformedCards.length > 0) {
                const firstId = String(transformedCards[0].id);
                if (firstId && !firstId.startsWith('card-')) {
                    transformedCards[0].isPremium =
                        await this.resolveUserPremium(firstId);
                }
            }

            this.cards = transformedCards;
            main.setCards(transformedCards);
            void this.enrichPremiumFlags(transformedCards);
            const superLikeState = headerStore.getSuperLikesState();
            main.setSuperLikeState(
                superLikeState.remaining,
                superLikeState.isPremium
            );
        } catch (error) {
            this.cards = [];
            main.setCards([]);
        }
    }

    private async resolveUserPremium(userId: string): Promise<boolean> {
        if (this.premiumCache.has(userId)) {
            return this.premiumCache.get(userId)!;
        }

        try {
            const profile = await ProfileApi.getProfileById(userId);
            const isPremium = Boolean(
                profile.user?.is_premium ??
                    profile.user?.premium_until
            );
            this.premiumCache.set(userId, isPremium);
            return isPremium;
        } catch {
            this.premiumCache.set(userId, false);
            return false;
        }
    }

    private async enrichPremiumFlags(cards: TransformedCard[]): Promise<void> {
        const tasks = cards.map(async (card) => {
            const id = String(card.id);
            if (!id || id.startsWith('card-')) return;

            const isPremium = await this.resolveUserPremium(id);
            if (card.isPremium !== isPremium) {
                card.isPremium = isPremium;
                main.setCardPremium(id, isPremium);
            }
        });

        await Promise.allSettled(tasks);
    }

    private async sendCardInteraction(
        cardId: string,
        actionType: string
    ): Promise<void> {
        try {
            if (actionType === 'super_like') {
                const state = headerStore.getSuperLikesState();
                if (state.remaining <= 0) {
                    main.setSuperLikeState(0, state.isPremium);
                    if (!state.isPremium) {
                        dispatcher.process({
                            type: Actions.NAVIGATE_TO,
                            payload: { path: '/premium' },
                        });
                    }
                    return;
                }
            }

            const mappedAction = actionType as CardAction;
            await CardApi.postCardInteraction(cardId, mappedAction);

            if (actionType === 'super_like') {
                const remaining = headerStore.consumeSuperLike();
                if (remaining <= 0) {
                    const state = headerStore.getSuperLikesState();
                    main.setSuperLikeState(
                        state.isPremium ? 0 : remaining,
                        state.isPremium
                    );
                }
            }
        } catch (error) {
            // Card action failed
        }
    }

    private async handleReportFromFeed(targetUserId: string): Promise<void> {
        try {
            await CardApi.postCardInteraction(targetUserId, 'dislike');
        } catch {
            // ignore interaction errors on report
        } finally {
            main.handleReportedCard(targetUserId);
        }
    }
}

export default new MainStore();
