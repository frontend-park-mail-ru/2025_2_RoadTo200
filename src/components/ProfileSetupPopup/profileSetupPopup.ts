import Handlebars from 'handlebars';
import ProfileApi, { type Profile } from '@/apiHandler/profileApi';
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
            console.log('API response in isProfileComplete:', response);
            
            // Проверяем разные форматы ответа от API
            let profile: Profile;
            if (response && response.profile) {
                profile = response.profile;
            } else if (response && (response as any).user) {
                // API возвращает объект с полем user
                profile = (response as any).user;
            } else if (response && (response as any).name !== undefined) {
                // API возвращает профиль напрямую
                profile = response as any as Profile;
            } else {
                console.warn('Profile data is missing or has unexpected format', response);
                return false;
            }
            
            console.log('Profile data:', profile);
            
            // Проверяем обязательные поля (убрали проверку даты рождения)
            const hasName = !!(profile.name && profile.name.trim() !== 'NAAAAAAne');
            const hasGender = !!(profile.gender && profile.gender !== '');
            
            // Дата рождения больше не обязательна для проверки
            const birthDate = (profile as any).birth_date || profile.birthDate;
            
            const isComplete = hasName && hasGender;
            
            console.log('Profile completeness check:', {
                hasName,
                hasGender,
                birthDate,
                isComplete
            });
            
            return isComplete;
        } catch (error) {
            console.error('Error checking profile completeness:', error);
            return false;
        }
    }

    /**
     * Получает текущие данные профиля для предзаполнения формы
     */
    private async getCurrentProfileData(): Promise<ProfileSetupData> {
        try {
            const response = await ProfileApi.getProfile();

            
            // Проверяем разные форматы ответа от API
            let profile: Profile;
            if (response && response.profile) {
                profile = response.profile;
            } else if (response && (response as any).user) {
                // API возвращает объект с полем user
                profile = (response as any).user;
            } else if (response && (response as any).name !== undefined) {
                // API возвращает профиль напрямую
                profile = response as any as Profile;
            } else {
                console.warn('Profile data is missing in getCurrentProfileData');
                return {};
            }
            
            // Обрабатываем snake_case поля от API
            const birthDate = (profile as any).birth_date || profile.birthDate || '';
            
            return {
                name: profile.name || '',
                birthDate: birthDate === '0001-01-01T00:00:00Z' ? '' : birthDate,
                gender: profile.gender || '',
                bio: profile.bio || ''
            };
        } catch (error) {
            console.error('Error fetching profile data:', error);
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
        Handlebars.registerHelper('eq', function(a, b) {
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
        
        const form = this.containerElement.querySelector('#profileSetupForm') as HTMLFormElement;
        
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
        
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        
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
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Сохранение...';
    }
    
    try {
        // Формируем данные для отправки
        const updateData: any = {
            name: name.trim(),
            gender,
            bio: bio ? bio.trim() : undefined
        };
        
        // Добавляем дату рождения только если она заполнена
        if (birthDate) {
            updateData.birthDate = birthDate;
        }
        
        // Отправляем данные на сервер
        await ProfileApi.updateProfileInfo(updateData);

        // Получаем обновленные данные профиля для AUTH_STATE_UPDATED
        const updatedProfileResponse = await ProfileApi.getProfile();
        let updatedUser: User | null = null;
        
        if (updatedProfileResponse && updatedProfileResponse.profile) {
            updatedUser = updatedProfileResponse.profile as User;
        } else if (updatedProfileResponse && (updatedProfileResponse as any).user) {
            updatedUser = (updatedProfileResponse as any).user as User;
        } else if (updatedProfileResponse && (updatedProfileResponse as any).name !== undefined) {
            updatedUser = updatedProfileResponse as any as User;
        }
        
        // Обновляем состояние аутентификации
        dispatcher.process({ 
            type: Actions.AUTH_STATE_UPDATED, 
            payload: { user: updatedUser } 
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
        console.error('Error updating profile:', error);
        this.showError(error instanceof Error ? error.message : 'Не удалось сохранить данные. Попробуйте снова.');
        
        // Включаем кнопку обратно
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Сохранить и продолжить';
        }
    }
}

    /**
     * Показывает ошибку
     */
    private showError(message: string): void {
        if (!this.containerElement) return;
        
        const errorElement = this.containerElement.querySelector('#profileSetupError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
    }

    /**
     * Очищает ошибку
     */
    private clearError(): void {
        if (!this.containerElement) return;
        
        const errorElement = this.containerElement.querySelector('#profileSetupError');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('visible');
        }
    }
}

export const profileSetupPopup = new ProfileSetupPopup();
