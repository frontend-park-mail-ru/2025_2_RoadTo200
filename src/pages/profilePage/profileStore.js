import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { profile } from "./profile.js";
import ProfileApi from "../../apiHandler/ProfileApi.js";

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
            default:
                break;
        }
    }

    async renderProfile() {
        try {
            const response = await ProfileApi.getProfile();

            if (response.status === 'ok' && response.profile) {
                const apiProfile = response.profile;

                this.profileData = {
                    description: apiProfile.description || "",
                    musician: apiProfile.musician || "",
                    quote: apiProfile.quote || "",
                    name: apiProfile.name || "",
                    age: apiProfile.age || "",
                    interests: [
                        { id: 1, name: "Рыбалка" },
                        { id: 2, name: "Кино" },
                        { id: 3, name: "Живопись" },
                    ],
                    photoCards: this.transformPhotosToCards(apiProfile.photos)
                };

                const contentContainer = document.getElementById('content-container');
                if (contentContainer) {
                    profile.parent = contentContainer;
                }

                profile.render(this.profileData);
            }
        } catch (error) {
        }
    }

    transformPhotosToCards(photos) {
        const photoCards = photos.map(photo => ({
            id: photo.id,
            image: photo.imageUrl,
            isUserPhoto: true,
            isPrimary: photo.isPrimary || false
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

            const updateData = { [field]: value };
            const response = await ProfileApi.updateProfileInfo(updateData);

            if (response.status === 'ok' && response.profile) {
                const apiProfile = response.profile;

                this.profileData.description = apiProfile.description || "";
                this.profileData.musician = apiProfile.musician || "";
                this.profileData.quote = apiProfile.quote || "";
                this.profileData.name = apiProfile.name || "";
                this.profileData.age = apiProfile.age || "";
            }
        } catch (error) {
            await this.renderProfile();
        }
    }

    async deletePhoto(payload) {
        try {
            const { photoId } = payload;
            if (!photoId) return;

            const response = await ProfileApi.deletePhoto(photoId);

            if (response.status === 'ok' && response.profile && response.profile.photos) {
                this.profileData.photoCards = this.transformPhotosToCards(response.profile.photos);
                profile.render(this.profileData);
            }
        } catch (error) {
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

                    if (response.status === 'ok' && response.profile) {
                        this.profileData.photoCards = this.transformPhotosToCards(response.profile.photos);
                        profile.render(this.profileData);
        
                    }
                } catch (error) {
                    let errorMessage = 'Ошибка при загрузке фотографий';

                    if (error.message) {
                        if (error.message.includes('413') || error.message.includes('слишком большой')) {
                            errorMessage = 'Файл слишком большой. Максимальный размер: 10MB';
                        } else if (error.message.includes('500')) {
                            errorMessage = 'Ошибка сервера при загрузке фотографий';
                        } else if (error.message.includes('Необходима авторизация')) {
                            errorMessage = 'Сессия истекла. Пожалуйста, войдите снова';
                        } else {
                            errorMessage = error.message;
                        }
                    }

                    alert(errorMessage);
                }
            };

            fileInput.click();
        } catch (error) {
        }
    }
}

export default new ProfileStore();
