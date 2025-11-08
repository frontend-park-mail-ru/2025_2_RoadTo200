import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { settings } from './settings';
import ProfileApi from '@/apiHandler/profileApi';

interface ProfileData {
    name: string;
    birthdate: string;
    email: string;
}

class SettingsStore implements Store {
    currentTab: string = 'profile';
    profileData: ProfileData = {
        name: '',
        birthdate: '',
        email: ''
    };

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_SETTINGS:
                await this.renderSettings(action.payload as { tab?: string } | undefined);
                break;

            case Actions.SWITCH_SETTINGS_TAB:
                if (action.payload) {
                    this.currentTab = (action.payload as { tab?: string }).tab || 'profile';
                    this.updateView();
                }
                break;

            case Actions.UPDATE_PROFILE_SETTINGS:
                if (action.payload) {
                    await this.updateProfileSettings(action.payload as { name: string; birthdate: string; email: string });
                }
                break;

            case Actions.CHANGE_PASSWORD:
                if (action.payload) {
                    await this.changePassword(action.payload as { oldPassword: string; newPassword: string; confirmPassword: string });
                }
                break;

            case Actions.DELETE_ACCOUNT:
                await this.deleteAccount();
                break;

            default:
                break;
        }
    }

    private async renderSettings(payload: { tab?: string } | undefined): Promise<void> {
        const container = document.getElementById('content-container');
        if (!container) {
            return;
        }

        settings.parent = container;

        try {
            const response = await ProfileApi.getProfile() as any;
            console.log('Settings: Profile response:', response);
            
            const user = response.user || {};
            this.profileData = {
                name: user.name || '',
                birthdate: user.birth_date ? this.formatDate(user.birth_date) : '',
                email: user.email || '',
            };
        } catch (error) {
            console.error('Error loading profile for settings:', error);
            this.profileData = { name: '', birthdate: '', email: '' };
        }

        if (payload && payload.tab) {
            this.currentTab = payload.tab;
        }

        await settings.render(this.profileData, this.currentTab);
    }
    
    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    private updateView(): void {
        settings.clearErrors();
        settings.renderContent(this.currentTab, this.profileData);
    }

    private async updateProfileSettings({ name, birthdate, email }: { name: string; birthdate: string; email: string }): Promise<void> {
        const errors: Record<string, string> = {};
        settings.clearErrors();

        if (!name) {
            errors.settingsNameError = 'Введите имя';
        }
        if (!birthdate) {
            errors.birthdateError = 'Введите дату рождения';
        }
        if (!email) {
            errors.emailError = 'Введите email';
        }

        if (Object.keys(errors).length) {
            settings.showErrors(errors);
            return;
        }

        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthdate)) {
            settings.showErrors({ birthdateError: 'Введите корректную дату рождения' });
            return;
        }

        // Проверка на 18 лет
        const [day, month, year] = birthdate.split('.').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            settings.showErrors({ birthdateError: 'вы должны быть старше 18' });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            settings.showErrors({ emailError: 'Некорректный email' });
            return;
        }

        // Конвертируем дату из DD.MM.YYYY в ISO формат для бэкенда
        const birthDateISO = new Date(year, month - 1, day).toISOString();

        try {
            await ProfileApi.updateProfileInfo({ 
                name,
                birth_date: birthDateISO
            });
            console.log('Profile settings updated successfully');
            
            this.profileData = { name, birthdate, email };
            this.updateView();
        } catch (err) {
            console.error('Error updating profile settings:', err);
            settings.showErrors({ emailError: 'Ошибка при обновлении профиля' });
        }
    }

    private async changePassword({ oldPassword, newPassword, confirmPassword }: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
        const errors: Record<string, string> = {};
        settings.clearErrors();

        if (!oldPassword) {
            errors.oldPasswordError = 'Введите старый пароль';
        }
        if (!newPassword) {
            errors.newPasswordError = 'Введите новый пароль';
        }
        if (!confirmPassword) {
            errors.confirmPasswordError = 'Подтвердите пароль';
        }

        if (Object.keys(errors).length) {
            settings.showErrors(errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            settings.showErrors({ confirmPasswordError: 'Пароли не совпадают' });
            return;
        }

        if (newPassword === oldPassword) {
            settings.showErrors({ newPasswordError: 'Новый пароль должен отличаться от старого' });
            return;
        }

        if (newPassword.length < 6) {
            settings.showErrors({ newPasswordError: 'Пароль должен содержать минимум 6 символов' });
            return;
        }

        try {
            await ProfileApi.changePassword(oldPassword, newPassword);
            console.log('Password changed successfully');
            this.updateView();
        } catch (error) {
            console.error('Error changing password:', error);
            settings.showErrors({ oldPasswordError: 'Неверный старый пароль' });
        }
    }

    private async deleteAccount(): Promise<void> {
        try {
            await ProfileApi.deleteAccount();
            
            await dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/login' }
            });
        } catch (error) {
            console.error('Ошибка при удалении аккаунта:', error);
            settings.showErrors({ generalError: 'Ошибка при удалении аккаунта' });
        }
    }
}

export default new SettingsStore();
