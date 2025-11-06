import { Actions } from '../../actions.js';
import { dispatcher } from '../../Dispatcher.js';
import { settings } from './settings.js';
import ProfileApi from '../../apiHandler/profileApi.js';

class SettingsStore {
    currentTab = 'profile';

    profileData = {};

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_SETTINGS:
                await this.renderSettings(action.payload);
                break;

            case Actions.SWITCH_SETTINGS_TAB:
                this.currentTab = action.payload?.tab || 'profile';
                this.updateView();
                break;

            case Actions.UPDATE_PROFILE_SETTINGS:
                await this.updateProfileSettings(action.payload);
                break;

            case Actions.CHANGE_PASSWORD:
                await this.changePassword(action.payload);
                break;

            case Actions.DELETE_ACCOUNT:
                await this.deleteAccount();
                break;

            default:
                break;
        }
    }

    async renderSettings(payload) {
        const container = document.getElementById('content-container');
        if (!container) {
            return;
        }

        settings.parent = container;

        try {
            const res = await ProfileApi.getProfile();
            if (res.status === 'ok' && res.profile) {
                const p = res.profile;
                this.profileData = {
                    name: p.name || '',
                    birthdate: p.birthdate || '',
                    email: p.email || '',
                };
            }
        } catch {
            this.profileData = { name: '', birthdate: '', email: '' };
        }

        
        if (payload && payload.tab) {
            this.currentTab = payload.tab;
        }

        await settings.render(this.profileData, this.currentTab);
    }

    updateView() {
        settings.clearErrors();
        settings.renderContent(this.currentTab, this.profileData);
    }

    async updateProfileSettings({ name, birthdate, email }) {
        const errors = {};
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

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            settings.showErrors({ emailError: 'Некорректный email' });
            return;
        }

        try {
            const response = await ProfileApi.updateProfileInfo({ name, email });
            if (response.status === 'ok') {
                this.profileData = { name, birthdate, email };
                this.updateView();
            }
        } catch (err) {
            settings.showErrors({ emailError: err.message || 'Ошибка при обновлении профиля' });
        }
    }

    async changePassword({ oldPassword, newPassword, confirmPassword }) {
        const errors = {};
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
            this.updateView();
        } catch {
            settings.showErrors({ oldPasswordError: 'Неверный пароль' });
        }
    }

    async deleteAccount() {
        try {
            await ProfileApi.deleteAccount();
            
            window.history.pushState(null, null, '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            console.error('Ошибка при удалении аккаунта:', error);
            settings.showErrors({ generalError: 'Ошибка при удалении аккаунта' });
        }
    }
}

export default new SettingsStore();
