import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { profile } from "./profile.js";
import ProfileApi from "../../apiHandler/profileApi.js";

class ProfileStore {
    profileData = {};

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MYCARD:
                await this.renderProfile();
                break;
            case Actions.UPDATE_PROFILE_FIELD:
                await this.updateProfileField(action.payload);
                break;
            case Actions.DELETE_PHOTO:
                await this.deletePhoto(action.payload);
                break;
            case Actions.ADD_PHOTO:
                await this.addPhoto();
                break;
            case Actions.ADD_INTEREST:
                await this.addInterest(action.payload);
                break;
            case Actions.DELETE_INTEREST:
                await this.deleteInterest(action.payload);
                break;
            default:
                break;
        }
    }

    async renderProfile() {
        try {
            const response = await ProfileApi.getProfile();
            
            console.log('Profile API response:', response);

            // Бекенд возвращает { user: {...}, preferences: {...}, photos: [...] }
            const user = response.user || {};
            const photos = response.photos || [];

            this.profileData = {
                description: user.bio || "",
                musician: "", // Нет в API
                quote: "", // Нет в API
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

            profile.render(this.profileData);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    transformPhotosToCards(photos) {
        const photoCards = photos.map(photo => ({
            id: photo.id,
            image: photo.photo_url, // Бекенд возвращает photo_url, а не imageUrl
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

    async updateProfileField(payload) {
        try {
            const { field, value } = payload;

            if (!field || value === undefined) return;

            // Маппинг полей фронтенда в поля бекенда
            const fieldMapping = {
                'description': 'bio',
                'name': 'name',
                'musician': 'bio', // Временно сохраняем в bio
                'quote': 'bio'     // Временно сохраняем в bio
            };

            const backendField = fieldMapping[field] || field;
            const updateData = { [backendField]: value };
            
            console.log('Updating profile field:', field, '→', backendField, 'with value:', value);

            await ProfileApi.updateProfileInfo(updateData);

            console.log('Profile field updated successfully');

            // После успешного обновления перезагружаем профиль
            await this.renderProfile();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            // Показываем пользователю понятное сообщение
            console.error('Не удалось сохранить изменения');
        }
    }

    async deletePhoto(payload) {
        try {
            const { photoId } = payload;
            if (!photoId || photoId === 'placeholder') {
                console.warn('Invalid photoId:', photoId);
                return;
            }

            console.log('Deleting photo with ID:', photoId);
            
            const response = await ProfileApi.deletePhoto(photoId);

            console.log('Delete photo response:', response);

            // Бекенд возвращает только { message: "..." }
            // Нужно перезапросить профиль для получения актуального списка фото
            await this.renderProfile();
            
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    }

    async addPhoto() {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;

            fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                try {
                    const response = await ProfileApi.uploadPhoto(files);

                    console.log('Upload photo response:', response);

                    // Бекенд возвращает { photos: [...] } - только загруженные фото
                    // Нужно перезапросить профиль для получения всех фото
                    await this.renderProfile();
                    
                } catch (error) {
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
                        // Не показываем сырую ошибку с бекенда пользователю
                    }

                    // Можно показать errorMessage пользователю через UI
                    console.error(errorMessage);
                }
            };

            fileInput.click();
        } catch (error) {
            console.error('Error in addPhoto:', error);
        }
    }

    async addInterest(payload) {
        try {
            const { name } = payload;
            
            if (!name || name.trim() === '') {
                return;
            }

            // Пока бекенд не поддерживает интересы, сохраняем локально
            const newInterest = {
                id: Date.now(),
                name: name.trim()
            };
            
            this.profileData.interests = this.profileData.interests || [];
            this.profileData.interests.push(newInterest);
            
            // Перерендерим профиль
            await this.rerenderProfile();
            
            console.log('Interest added:', newInterest);
        } catch (error) {
            console.error('Error adding interest:', error);
        }
    }

    async deleteInterest(payload) {
        try {
            const { id } = payload;
            
            if (!this.profileData.interests) {
                return;
            }
            
            // Удаляем интерес из локального состояния
            this.profileData.interests = this.profileData.interests.filter(
                interest => interest.id !== id
            );
            
            // Перерендерим профиль
            await this.rerenderProfile();
            
            console.log('Interest deleted:', id);
        } catch (error) {
            console.error('Error deleting interest:', error);
        }
    }

    async rerenderProfile() {
        // Просто перерендерим без запроса к API
        await profile.render(this.profileData);
    }
}

export default new ProfileStore();
