import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { matchProfile } from './matchProfile';
import { getActivitiesFromData } from '@/utils/activityIcons';

interface PhotoCard {
    id: string;
    image: string;
    isUserPhoto: boolean;
    isPrimary?: boolean;
}

interface MatchProfileData {
    id: string;
    name: string;
    age: number | null;
    description: string;
    musician: string;
    quote: string;
    interests: any[];
    photoCards: PhotoCard[];
    activities: Array<{ name: string; icon: string }>;
}

class MatchProfileStore implements Store {
    matchData: MatchProfileData | null = null;
    currentMatchId: string | null = null;
    matchesCache: Map<string, any> = new Map();

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MATCH_PROFILE:
                if (action.payload) {
                    await this.renderMatchProfile(
                        action.payload as { matchId: string }
                    );
                }
                break;
            case Actions.MATCH_CARD_CLICK:
                if (action.payload) {
                    await this.handleMatchCardClick(
                        action.payload as { matchId: string; userData: any }
                    );
                }
                break;
            default:
                break;
        }
    }

    private async handleMatchCardClick(payload: {
        matchId: string;
        userData: any;
    }): Promise<void> {
        const { matchId, userData } = payload;
        if (!matchId) return;

        if (userData) {
            this.matchesCache.set(matchId, userData);
        }

        await dispatcher.process({
            type: Actions.NAVIGATE_TO,
            payload: { path: `/matches/${matchId}` },
        });
    }

    private async renderMatchProfile(payload: {
        matchId: string;
    }): Promise<void> {
        try {
            const { matchId } = payload;
            if (!matchId) {
                // console.error('No matchId provided');
                return;
            }

            this.currentMatchId = matchId;

            const contentContainer =
                document.getElementById('content-container');
            if (contentContainer) {
                matchProfile.parent = contentContainer;
            }

            const userData = this.matchesCache.get(matchId);

            if (!userData) {
                // console.error('No user data found in cache for matchId:', matchId);
                return;
            }

            // Получаем активности из данных пользователя
            const activities = getActivitiesFromData(userData);

            this.matchData = {
                id: userData.id,
                name: userData.name || '',
                age: this.calculateAge(userData.birth_date),
                description: userData.bio || 'Информация отсутствует',
                musician: 'Не указано',
                quote: 'Не указано',
                interests: [],
                photoCards: this.transformImagesToCards(userData.images || []),
                activities: activities,
            };

            await matchProfile.render(this.matchData);
        } catch (error) {
            // console.error('Error loading match profile:', error);
        }
    }

    private calculateAge(birthDate: string | undefined): number | null {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            age--;
        }
        return age;
    }

    private transformImagesToCards(images: string[]): PhotoCard[] {
        const photoCards: PhotoCard[] = images.map((imageUrl, index) => ({
            id: `photo-${index}`,
            image: imageUrl,
            isUserPhoto: true,
            isPrimary: index === 0,
        }));

        while (photoCards.length < 4) {
            photoCards.push({
                id: `placeholder-${photoCards.length}`,
                image: '',
                isUserPhoto: false,
            });
        }

        return photoCards;
    }
}

export default new MatchProfileStore();
