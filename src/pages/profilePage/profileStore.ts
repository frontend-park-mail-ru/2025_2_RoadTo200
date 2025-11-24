import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { profile } from './profile';
import ProfileApi from '@/apiHandler/profileApi';
import { ACTIVITY_ICONS } from '@/utils/activityIcons';

interface PhotoCard {
    id: string | number;
    image: string;
    isUserPhoto: boolean;
    isPrimary?: boolean;
}

interface ActivityItem {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
}

interface ProfileData {
    description: string;
    musician: string;
    quote: string;
    name: string;
    age: string | number;
    photoCards: PhotoCard[];
    activities: ActivityItem[];
    interests: any[];
    userId?: string;
}

class ProfileStore implements Store {
    profileData: ProfileData = {
        description: '',
        musician: '',
        quote: '',
        name: '',
        age: '',
        photoCards: [],
        activities: [],
        interests: [],
        userId: '',
    };

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MYCARD:
                await this.renderProfile();
                break;
            case Actions.UPDATE_PROFILE_FIELD:
                if (action.payload) {
                    await this.updateProfileField(
                        action.payload as { field: string; value: string }
                    );
                }
                break;
            case Actions.DELETE_PHOTO:
                if (action.payload) {
                    await this.deletePhoto(
                        action.payload as { photoId: string }
                    );
                }
                break;
            case Actions.ADD_PHOTO:
                await this.addPhoto();
                break;
            case Actions.UPDATE_ACTIVITY:
                if (action.payload) {
                    await this.toggleActivity(
                        action.payload as { [key: string]: boolean }
                    );
                }
                break;
            default:
                break;
        }
    }

    private async renderProfile(): Promise<void> {
        try {
            const response = await ProfileApi.getProfile();

            const user = response.user || {};
            const photos = response.photos || [];

            // Parse user interests (can be array of objects or boolean flags)
            const userInterests = new Set<string>();

            // Check for interests array at response level (primary source)
            if (Array.isArray(response.interests)) {
                response.interests.forEach((interest: any) => {
                    if (interest?.theme) {
                        userInterests.add(interest.theme.toLowerCase());
                    }
                });
            }

            // Check for interests array in user object (fallback)
            if (Array.isArray((user as any).interests)) {
                (user as any).interests.forEach((interest: any) => {
                    if (interest?.theme) {
                        userInterests.add(interest.theme.toLowerCase());
                    }
                });
            }

            // Check for boolean flags (fallback/legacy)
            Object.keys(ACTIVITY_ICONS).forEach((key) => {
                if ((user as any)[key] === true) {
                    userInterests.add(key.toLowerCase());
                }
            });

            // Filter to show only selected activities
            const activities = Object.entries(ACTIVITY_ICONS)
                .filter(([key]) => userInterests.has(key.toLowerCase()))
                .map(([, data]) => ({
                    id: data.name,
                    name: data.name,
                    icon: data.icon,
                    isActive: true,
                }));

            this.profileData = {
                description: user.bio || '',
                musician: user.artist || '',
                quote: user.quote || '',
                name: user.name || '',
                age: user.birth_date ? this.calculateAge(user.birth_date) : '',
                photoCards: this.transformPhotosToCards(photos),
                activities: activities,
                interests: [],
                userId: user.id || '',
            };

            const contentContainer =
                document.getElementById('content-container');
            if (contentContainer) {
                profile.parent = contentContainer;
            }

            await profile.render(this.profileData);
        } catch (error) {
            // console.error('Error loading profile:', error);
        }
    }

    private calculateAge(birthDate: string): number {
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

    private transformPhotosToCards(photos: any[]): PhotoCard[] {
        const MAX_VISIBLE_SLOTS = 4;

        const normalizedPhotos: PhotoCard[] = (photos || [])
            .sort((a, b) => {
                const orderA =
                    typeof a.display_order === 'number'
                        ? a.display_order
                        : 0;
                const orderB =
                    typeof b.display_order === 'number'
                        ? b.display_order
                        : 0;
                return orderA - orderB;
            })
            .map((photo) => ({
                id: photo.id,
                image: photo.photo_url,
                isUserPhoto: true,
                isPrimary:
                    photo.is_primary || photo.display_order === 0 || false,
            }))
            .slice(0, MAX_VISIBLE_SLOTS);

        if (normalizedPhotos.length < MAX_VISIBLE_SLOTS) {
            normalizedPhotos.push({
                id: `placeholder-${normalizedPhotos.length}`,
                image: '',
                isUserPhoto: false,
            });
        }

        return normalizedPhotos;
    }

    private async updateProfileField(payload: {
        field: string;
        value: string;
    }): Promise<void> {
        try {
            const { field, value } = payload;

            if (!field || value === undefined) return;

            const fieldMapping: Record<string, string> = {
                description: 'bio',
                name: 'name',
                musician: 'artist',
                quote: 'quote',
            };

            const backendField = fieldMapping[field] || field;
            const updateData = { [backendField]: value };

            await ProfileApi.updateProfileInfo(updateData);
            await this.renderProfile();
        } catch (error) {
            // console.error('Error updating profile:', error);
        }
    }

    private async deletePhoto(payload: { photoId: string }): Promise<void> {
        try {
            const { photoId } = payload;
            if (!photoId || photoId.startsWith('placeholder')) {
                return;
            }

            await ProfileApi.deletePhoto(String(photoId));
            await this.renderProfile();
        } catch (error) {
            // console.error('Error deleting photo:', error);
        }
    }

    private async addPhoto(): Promise<void> {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;

            fileInput.onchange = async (e) => {
                const target = e.target as HTMLInputElement;
                const files = Array.from(target.files || []);
                if (files.length === 0) return;

                try {
                    await ProfileApi.uploadPhoto(files);
                    await this.renderProfile();
                } catch (error: any) {
                    // Handle error
                }
            };

            fileInput.click();
        } catch (error) {
            // console.error('Error in addPhoto:', error);
        }
    }

    private async toggleActivity(payload: { [key: string]: boolean }): Promise<void> {
        try {
            const [activityId, isActive] = Object.entries(payload)[0];

            const activity = this.profileData.activities.find(a => a.id === activityId);
            if (activity) {
                activity.isActive = isActive;
            }

            await this.saveInterests();
            await this.rerenderProfile();
        } catch (error) {
            // console.error('Error toggling activity:', error);
        }
    }

    private async saveInterests(): Promise<void> {
        try {
            const interestsPayload = this.profileData.activities
                .filter(a => a.isActive)
                .map((activity) => ({
                    theme: activity.id.toLowerCase(),
                }));
            await ProfileApi.updateInterests(interestsPayload);
        } catch (error) {
            // console.error('Error saving interests:', error);
        }
    }

    private async rerenderProfile(): Promise<void> {
        await profile.render(this.profileData);
    }
}

export default new ProfileStore();
