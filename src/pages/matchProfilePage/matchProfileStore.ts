import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { matchProfile } from './matchProfile';
import { ACTIVITY_ICONS } from '@/utils/activityIcons';
import profileApi from '@/apiHandler/profileApi';
import notificationApi from '@/apiHandler/notificationApi';

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
    isMatched?: boolean;
    isLiked?: boolean;
    hasOnlyOnePhoto?: boolean;
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

        const userId = userData?.id || userData?.user_id || userData?.userId || matchId;

        if (userData) {
            this.matchesCache.set(userId, userData);
        }

        window.history.pushState(null, '', `/profile/${userId}`);

        await dispatcher.process({
            type: Actions.RENDER_MATCH_PROFILE,
            payload: { matchId: userId },
        });
    }

    private async renderMatchProfile(payload: {
        matchId: string;
    }): Promise<void> {
        try {
            const { matchId } = payload;
            if (!matchId) {
                return;
            }

            this.currentMatchId = matchId;

            // Mark all notifications from this user as read
            await this.markUserNotificationsAsRead(matchId);

            const contentContainer =
                document.getElementById('content-container');
            if (contentContainer) {
                matchProfile.parent = contentContainer;
            }

            let userData = this.matchesCache.get(matchId);

            if (!userData) {
                try {
                    const profileResponse = await profileApi.getProfileById(matchId);
                    userData = {
                        id: profileResponse.user.id,
                        user_id: profileResponse.user.id,
                        name: profileResponse.user.name,
                        bio: profileResponse.user.bio,
                        quote: profileResponse.user.quote,
                        birth_date: profileResponse.user.birth_date,
                        favorite_artist: profileResponse.user.artist,
                        images: profileResponse.photos.map(photo => photo.photo_url),
                        interests: profileResponse.user.interests || [],
                        is_matched: profileResponse.is_matched,
                        is_liked: profileResponse.is_liked,
                    };
                } catch (error) {
                    return;
                }
            }

            const userInterests = new Set<string>();

            if (Array.isArray(userData.interests)) {
                userData.interests.forEach((interest: any) => {
                    if (interest?.theme) {
                        userInterests.add(interest.theme.toLowerCase());
                    }
                });
            }

            Object.keys(ACTIVITY_ICONS).forEach((key) => {
                if (userData[key] === true) {
                    userInterests.add(key.toLowerCase());
                }
            });

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

            const totalUserPhotos = photoCards.filter(card => card.isUserPhoto).length;
            
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
                isPremium: Boolean(userData.is_premium),
                isMatched: userData.is_matched,
                isLiked: userData.is_liked,
                hasOnlyOnePhoto: totalUserPhotos === 1,
            };

            await matchProfile.render(this.matchData);
        } catch (error) {
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
        if (!images || images.length === 0) {
            return [{
                id: 'placeholder-0',
                image: '/src/assets/image.png',
                isUserPhoto: true,
                isPrimary: true,
            }];
        }

        const photoCards: PhotoCard[] = images.map((imageUrl, index) => ({
            id: `photo-${index}`,
            image: imageUrl,
            isUserPhoto: true,
            isPrimary: index === 0,
        }));

        // Only add placeholders if there's more than one photo
        if (photoCards.length > 1) {
            while (photoCards.length < 4) {
                photoCards.push({
                    id: `placeholder-${photoCards.length}`,
                    image: '',
                    isUserPhoto: false,
                });
            }
        }

        return photoCards;
    }

    private async markUserNotificationsAsRead(userId: string): Promise<void> {
        try {
            const response = await notificationApi.getNotifications();
            const unreadUserNotifications = response.notifications.filter(
                n => !n.is_read && n.from_user_id === userId
            );

            for (const notification of unreadUserNotifications) {
                await notificationApi.markAsRead(notification.id);
                dispatcher.process({
                    type: Actions.MARK_NOTIFICATION_READ,
                    payload: { id: notification.id, type: notification.type },
                });
            }
        } catch (error) {

        }
    }
}

export default new MatchProfileStore();
