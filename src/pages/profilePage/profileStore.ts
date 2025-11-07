import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { profile } from './profile';
import ProfileApi from '@/apiHandler/profileApi';

interface PhotoCard {
    id: string | number;
    image: string;
    isUserPhoto: boolean;
    isPrimary?: boolean;
}

interface Interest {
    id: number;
    name: string;
}

interface ProfileData {
    description: string;
    musician: string;
    quote: string;
    name: string;
    age: string | number;
    interests: Interest[];
    photoCards: PhotoCard[];
}

class ProfileStore implements Store {
    profileData: ProfileData = {
        description: '',
        musician: '',
        quote: '',
        name: '',
        age: '',
        interests: [],
        photoCards: []
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
                    await this.updateProfileField(action.payload as { field: string; value: string });
                }
                break;
            case Actions.DELETE_PHOTO:
                if (action.payload) {
                    await this.deletePhoto(action.payload as { photoId: string });
                }
                break;
            case Actions.ADD_PHOTO:
                await this.addPhoto();
                break;
            case Actions.ADD_INTEREST:
                if (action.payload) {
                    await this.addInterest(action.payload as { name: string });
                }
                break;
            case Actions.DELETE_INTEREST:
                if (action.payload) {
                    await this.deleteInterest(action.payload as { id: number });
                }
                break;
            default:
                break;
        }
    }

    private async renderProfile(): Promise<void> {
        try {
            const response = await ProfileApi.getProfile() as any;
            
            console.log('Profile API response:', response);

            const user = response.user || {};
            const photos = response.photos || [];

            this.profileData = {
                description: user.bio || "",
                musician: "",
                quote: "",
                name: user.name || "",
                age: user.birth_date ? this.calculateAge(user.birth_date) : "",
                interests: [
                    { id: 1, name: "Рыбалка" },
                    { id: 2, name: "Кино" },
                    { id: 3, name: "Живопись" },
                ],
                photoCards: this.transformPhotosToCards(photos)
            };

            const contentContainer = document.getElementById('content-container');
            if (contentContainer) {
                profile.parent = contentContainer;
            }

            await profile.render(this.profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    private calculateAge(birthDate: string): number {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    private transformPhotosToCards(photos: any[]): PhotoCard[] {
        const photoCards: PhotoCard[] = photos.map(photo => ({
            id: photo.id,
            image: photo.photo_url,
            isUserPhoto: true,
            isPrimary: photo.is_primary || photo.display_order === 0 || false
        }));

        if (photoCards.length < 4) {
            photoCards.push({
                id: 'placeholder',
                image: '',
                isUserPhoto: false
            });
        }

        return photoCards;
    }

    private async updateProfileField(payload: { field: string; value: string }): Promise<void> {
        try {
            const { field, value } = payload;

            if (!field || value === undefined) return;

            const fieldMapping: Record<string, string> = {
                'description': 'bio',
                'name': 'name',
                'musician': 'bio',
                'quote': 'bio'
            };

            const backendField = fieldMapping[field] || field;
            const updateData = { [backendField]: value };
            
            console.log('Updating profile field:', field, '→', backendField, 'with value:', value);

            await ProfileApi.updateProfileInfo(updateData);

            console.log('Profile field updated successfully');

            await this.renderProfile();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Не удалось сохранить изменения');
        }
    }

    private async deletePhoto(payload: { photoId: string }): Promise<void> {
        try {
            const { photoId } = payload;
            if (!photoId || photoId === 'placeholder') {
                console.warn('Invalid photoId:', photoId);
                return;
            }

            console.log('Deleting photo with ID:', photoId);
            
            const response = await ProfileApi.deletePhoto(photoId);

            console.log('Delete photo response:', response);

            await this.renderProfile();
            
        } catch (error) {
            console.error('Error deleting photo:', error);
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
                    const response = await ProfileApi.uploadPhoto(files);

                    console.log('Upload photo response:', response);

                    await this.renderProfile();
                    
                } catch (error: any) {
                    console.error('Error uploading photo:', error);
                    let errorMessage = 'Ошибка при загрузке фотографий';

                    if (error.message) {
                        if (error.message.includes('413') || error.message.includes('слишком большой')) {
                            errorMessage = 'Файл слишком большой. Максимальный размер: 10MB';
                        } else if (error.message.includes('500')) {
                            errorMessage = 'Ошибка сервера при загрузке фотографий';
                        } else if (error.message.includes('Необходима авторизация')) {
                            errorMessage = 'Сессия истекла. Пожалуйста, войдите снова';
                        }
                    }

                    console.error(errorMessage);
                }
            };

            fileInput.click();
        } catch (error) {
            console.error('Error in addPhoto:', error);
        }
    }

    private async addInterest(payload: { name: string }): Promise<void> {
        try {
            const { name } = payload;
            
            if (!name || name.trim() === '') {
                return;
            }

            const newInterest: Interest = {
                id: Date.now(),
                name: name.trim()
            };
            
            this.profileData.interests = this.profileData.interests || [];
            this.profileData.interests.push(newInterest);
            
            await this.rerenderProfile();
            
            console.log('Interest added:', newInterest);
        } catch (error) {
            console.error('Error adding interest:', error);
        }
    }

    private async deleteInterest(payload: { id: number }): Promise<void> {
        try {
            const { id } = payload;
            
            if (!this.profileData.interests) {
                return;
            }
            
            this.profileData.interests = this.profileData.interests.filter(
                interest => interest.id !== id
            );
            
            await this.rerenderProfile();
            
            console.log('Interest deleted:', id);
        } catch (error) {
            console.error('Error deleting interest:', error);
        }
    }

    private async rerenderProfile(): Promise<void> {
        await profile.render(this.profileData);
    }
}

export default new ProfileStore();
