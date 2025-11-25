import Handlebars from 'handlebars';
import ProfileApi, {
    type ProfileResponse,
    type ProfileUser,
    type UserPhoto,
} from '@/apiHandler/profileApi';
import './profileSetupPopup.scss';
import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';

const TEMPLATE_PATH = '/src/components/ProfileSetupPopup/profileSetupPopup.hbs';

interface ProfileSetupData {
    name?: string;
    birthDate?: string;
    gender?: string;
    bio?: string;
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return response.text();
};

export class ProfileSetupPopup {
    private containerElement: HTMLElement | null = null;
    private onCompleteCallback: (() => void) | null = null;

    /**
     * Проверяет, заполнен ли профиль пользователя
     */
    static async isProfileComplete(): Promise<boolean> {
        try {
            const response = await ProfileApi.getProfile();
            const profile = ProfileSetupPopup.extractUser(response);
            if (!profile) {
                return false;
            }

            const hasName = ProfileSetupPopup.hasMeaningfulName(profile);
            const hasGender = ProfileSetupPopup.hasValidGender(profile);
            const hasPhoto = ProfileSetupPopup.hasApprovedPhoto(response) || true; 

            console.log('Profile completeness check:', {
                hasName,
                hasGender,
                hasPhoto,
            });

            return hasName && hasGender && hasPhoto;
        } catch (error) {
            // console.error('Error checking profile completeness:', error);
            return false;
        }
    }

    /**
     * Получает текущие данные профиля для предзаполнения формы
     */
    private async getCurrentProfileData(): Promise<ProfileSetupData> {
        try {
            const response = await ProfileApi.getProfile();
            const profile = ProfileSetupPopup.extractUser(response);
            if (!profile) {
                return {};
            }

            const profileRecord = profile as Record<string, unknown>;
            const birthDate = ProfileSetupPopup.normalizeBirthDate(
                profile.birth_date ||
                    (typeof profileRecord.birthDate === 'string'
                        ? profileRecord.birthDate
                        : undefined)
            );

            return {
                name: profile.name || '',
                birthDate,
                gender: profile.gender || '',
                bio: profile.bio || '',
            };
        } catch (error) {
            // console.error('Error fetching profile data:', error);
            return {};
        }
    }

    /**
     * Показывает попап
     */
    async show(onComplete?: () => void): Promise<void> {
        this.onCompleteCallback = onComplete || null;

        // Получаем текущие данные профиля
        const profileData = await this.getCurrentProfileData();

        // Загружаем и компилируем шаблон
        const templateString = await fetchTemplate(TEMPLATE_PATH);

        // Регистрируем helper для сравнения в Handlebars
        Handlebars.registerHelper('eq', function (a: any, b: any) {
            return a === b;
        });

        const template = Handlebars.compile(templateString);
        const html = template(profileData);

        // Создаём контейнер и вставляем попап
        this.containerElement = document.createElement('div');
        this.containerElement.innerHTML = html;
        document.body.appendChild(this.containerElement);

        // Добавляем обработчики событий
        this.attachEventListeners();

        // Предотвращаем скролл body
        document.body.style.overflow = 'hidden';
    }

    /**
     * Скрывает попап
     */
    private hide(): void {
        if (this.containerElement) {
            this.containerElement.remove();
            this.containerElement = null;
        }

        // Восстанавливаем скролл
        document.body.style.overflow = '';
    }

    /**
     * Прикрепляет обработчики событий
     */
    private attachEventListeners(): void {
        if (!this.containerElement) return;

        const form = this.containerElement.querySelector(
            '#profileSetupForm'
        ) as HTMLFormElement;

        if (form) {
            form.addEventListener('submit', this.handleSubmit.bind(this));
        }

        // Overlay не закрывает попап - пользователь должен заполнить профиль
        // const overlay = this.containerElement.querySelector('.profile-setup-popup__overlay');
        // if (overlay) {
        //     overlay.addEventListener('click', this.hide.bind(this));
        // }
    }

    /**
     * Обрабатывает отправку формы
     */
    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();

        this.clearError();

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const name = formData.get('name') as string;
        const birthDate = formData.get('birthDate') as string;
        const gender = formData.get('gender') as string;
        const bio = formData.get('bio') as string;

        // Валидация обязательных полей
        if (!name || name.trim() === '') {
            this.showError('Пожалуйста, введите ваше имя');
            return;
        }

        if (!gender) {
            this.showError('Пожалуйста, выберите пол');
            return;
        }
        
        // Проверка возраста только если дата заполнена
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const today = new Date();
            const age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            const dayDiff = today.getDate() - birthDateObj.getDate();

            const actualAge =
                monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)
                    ? age - 1
                    : age;

            if (actualAge < 18) {
                this.showError('Вам должно быть не менее 18 лет');
                return;
            }

            if (actualAge > 100) {
                this.showError('Пожалуйста, проверьте дату рождения');
                return;
            }
        }

        // Отключаем кнопку на время отправки
        const submitButton = form.querySelector(
            'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Сохранение...';
        }

        try {
            // Формируем данные для отправки
            const updateData: any = {
                name: name.trim(),
                gender,
                bio: bio ? bio.trim() : undefined,
            };

            // Добавляем дату рождения только если она заполнена
            if (birthDate) {
                updateData.birth_date = birthDate;
            }

            // Отправляем данные на сервер
            await ProfileApi.updateProfileInfo(updateData);

            // Получаем обновленные данные профиля для AUTH_STATE_UPDATED
            const updatedProfileResponse = await ProfileApi.getProfile();
            const updatedUser = ProfileSetupPopup.extractUser(
                updatedProfileResponse
            );

            // Обновляем состояние аутентификации
            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: updatedUser },
            });

            // Pre-render header
            dispatcher.process({ type: Actions.RENDER_HEADER });

            // Закрываем попап
            this.hide();

            // Вызываем callback если есть
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
        } catch (error) {
            // console.error('Error updating profile:', error);
            const translatedError = this.translateError(error);
            this.showError(translatedError);

            // Включаем кнопку обратно
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Сохранить и продолжить';
            }
        }
    }

    /**
     * Переводит ошибку от бека на русский язык
     */
    private translateError(error: any): string {
        // Если это объект ошибки с message
        let errorMessage = '';
        if (error && typeof error === 'object' && error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        // Переводим известные ошибки от бека
        if (errorMessage.includes('name too long') || errorMessage.includes('max 50 characters')) {
            return 'Имя слишком длинное, максимум 50 символов';
        }
        if (errorMessage.includes('bio too long') || errorMessage.includes('max 500 characters')) {
            return 'Описание слишком длинное, максимум 500 символов';
        }
        if (errorMessage.includes('user_bio_length_check') || errorMessage.includes('SQLSTATE 23514')) {
            return 'Описание слишком длинное, максимум 500 символов';
        }
        if (errorMessage.includes('user_name_length_check')) {
            return 'Имя слишком длинное, максимум 50 символов';
        }
        if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('date')) {
            return 'Некорректная дата рождения';
        }
        
        // Если ошибка уже на русском, возвращаем как есть
        if (/[а-яА-Я]/.test(errorMessage)) {
            return errorMessage;
        }
        
        // Для неизвестных ошибок возвращаем общее сообщение
        return 'Не удалось сохранить данные. Попробуйте снова.';
    }

    /**
     * Показывает ошибку
     */
    private showError(message: string): void {
        if (!this.containerElement) return;
        const errorElement = this.containerElement.querySelector(
            '#profileSetupError'
        ) as HTMLElement | null;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Очищает ошибку
     */
    private clearError(): void {
        if (!this.containerElement) return;
        const errorElement = this.containerElement.querySelector(
            '#profileSetupError'
        ) as HTMLElement | null;
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    private static extractUser(
        response:
            | ProfileResponse
            | { profile?: ProfileUser }
            | { user?: ProfileUser }
            | ProfileUser
            | null
            | undefined
    ): ProfileUser | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        if ('user' in response && response.user) {
            return response.user as ProfileUser;
        }

        if ('profile' in response && response.profile) {
            return response.profile as ProfileUser;
        }

        if ('name' in response) {
            return response as ProfileUser;
        }

        return null;
    }

    private static hasMeaningfulName(profile: ProfileUser): boolean {
        const normalizedName = (profile.name || '').trim();

        if (normalizedName.length < 2) {
            return false;
        }

        const lowerName = normalizedName.toLowerCase();

        console.log(lowerName)
        const invalidNames = new Set(['naaaaaane', 'name', 'username']);
        if (invalidNames.has(lowerName)) {
            return false;
        }

        // if (/^user[\d_-]*$/i.test(normalizedName)) {
        //     return false;
        // }

        const emailLower = (profile.email || '').trim().toLowerCase();
        if (emailLower.length > 0) {
            if (lowerName === emailLower) {
                return false;
            }
        }

        return true;
    }

    private static hasValidGender(profile: ProfileUser): boolean {
        const genderValue = (profile.gender || '').toString().toLowerCase();
        const invalidValues = new Set([
            '',
            'not_specified',
            'unspecified',
            'unknown',
            'prefer_not_to_say',
            'none',
        ]);

        return genderValue.length > 0 && !invalidValues.has(genderValue);
    }

    private static hasApprovedPhoto(response: ProfileResponse): boolean {
        const photos = Array.isArray(response.photos) ? response.photos : [];
        if (photos.length === 0) {
            return true;
        }

        return photos.some((photo) => ProfileSetupPopup.isPhotoApproved(photo));
    }

    private static isPhotoApproved(photo: UserPhoto): boolean {
        if (!photo) {
            return false;
        }

        if (typeof photo.is_approved === 'boolean') {
            return photo.is_approved;
        }

        return true;
    }

    private static normalizeBirthDate(birthDate?: string): string {
        if (!birthDate) {
            return '';
        }

        const trimmed = birthDate.trim();
        if (!trimmed || trimmed.startsWith('0001-01-01')) {
            return '';
        }

        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
            return `${year}-${month}-${day}`;
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return '';
    }
}

export const profileSetupPopup = new ProfileSetupPopup();