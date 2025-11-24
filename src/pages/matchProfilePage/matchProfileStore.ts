import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { matchProfile } from './matchProfile';
import { ACTIVITY_ICONS } from '@/utils/activityIcons';

interface PhotoCard {
    id: string;
    image: string;
    isUserPhoto: boolean;
    isPrimary?: boolean;
}

interface MatchProfileData {
    id: string;
    matchId: string;
    userId: string;
    name: string;
    age: number | null;
    description: string;
    musician: string;
    quote: string;
    interests: any[];
    photoCards: PhotoCard[];
    heroPhoto?: string;
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

        // Update URL without triggering navigation cycle
        window.history.pushState(null, '', `/matches/${matchId}`);

        // Directly render match profile
        await dispatcher.process({
            type: Actions.RENDER_MATCH_PROFILE,
            payload: { matchId },
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

            // Parse user interests to get selected activities
            const userInterests = new Set<string>();

            // Check for interests array in userData
            if (Array.isArray(userData.interests)) {
                userData.interests.forEach((interest: any) => {
                    if (interest?.theme) {
                        userInterests.add(interest.theme.toLowerCase());
                    }
                });
            }

            // Check for boolean flags (fallback/legacy)
            Object.keys(ACTIVITY_ICONS).forEach((key) => {
                if (userData[key] === true) {
                    userInterests.add(key.toLowerCase());
                }
            });

            // Filter activities to only show selected ones
            const activities = Object.entries(ACTIVITY_ICONS)
                .filter(([key]) => userInterests.has(key.toLowerCase()))
                .map(([, data]) => ({
                    name: data.name,
                    icon: data.icon,
                }));

            const photoCards = this.transformImagesToCards(
                userData.images || []
            );

            const userId =
                userData.id ||
                userData.user_id ||
                userData.other_user_id ||
                matchId;

            this.matchData = {
                id: userId,
                matchId,
                userId,
                name: userData.name || '',
                age: this.calculateAge(userData.birth_date),
                description: userData.bio || 'Информация отсутствует',
                musician: userData.favorite_artist || 'Не указано',
                quote: userData.quote || 'Не указано',
                interests: userData.interests || [],
                heroPhoto: photoCards[0]?.image,
                photoCards: photoCards.slice(1),
                activities,
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
