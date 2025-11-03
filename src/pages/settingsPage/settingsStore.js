import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { settings } from "./settings.js";
import ProfileApi from "../../apiHandler/profileApi.js";
import AuthApi from "../../apiHandler/authApi.js";

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
                await this.switchTab(action.payload);
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
            case Actions.SETTINGS_CLEAR_ERRORS:
                this.clearErrors();
                break;
            default:
                break;
        }
    }

    showErrors(errors) {
        Object.keys(errors).forEach(key => {
            const errorElement = document.querySelector(`#${key}`);
            if (errorElement) {
                errorElement.textContent = errors[key];
            }
            
            const inputId = key.replace('Error', '');
            const inputElement = document.querySelector(`#${inputId}`);
            if (inputElement) {
                inputElement.classList.add('error-input');
            }
        });
    }

    clearErrors() {
        document.querySelectorAll('.error-message')?.forEach(el => el.textContent = '');
        document.querySelectorAll('.form-input')?.forEach(input => input.classList.remove('error-input'));
    }

    async renderSettings(payload) {
        this.currentTab = payload?.tab || 'profile';

        try {
            const response = await ProfileApi.getProfile();
            if (response.status === 'ok' && response.profile) {
                const apiProfile = response.profile;
                this.profileData = {
                    name: apiProfile.name || '',
                    birthdate: apiProfile.birthdate || '15.02.2006',
                    email: apiProfile.email || ''
                };
            }
        } catch (error) {
            this.profileData = { name: '', birthdate: '', email: '' };
        }

        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            settings.parent = contentContainer;
        }

        await settings.render({ currentTab: this.currentTab, profile: this.profileData });
    }

    async switchTab(payload) {
        this.currentTab = payload.tab;
        dispatcher.process({
            type: Actions.SETTINGS_RENDER_CONTENT,
            payload: { currentTab: this.currentTab, profileData: this.profileData }
        });
    }

    async updateProfileSettings(payload) {
        const { name, birthdate, email } = payload;
        const errors = {};

        if (!name || !birthdate || !email) {
            if (!name) errors.settingsNameError = 'Введите имя';
            if (!birthdate) errors.birthdateError = 'Введите дату рождения';
            if (!email) errors.emailError = 'Введите email';
            this.showErrors(errors);
            return;
        }

        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(birthdate)) {
            errors.birthdateError = 'вы должны быть старше 18';
            this.showErrors(errors);
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.emailError = 'вы ввели некорректный email';
            this.showErrors(errors);
            return;
        }

        try {
            const response = await ProfileApi.updateProfileInfo({ name, email });
            if (response.status === 'ok') {
                this.profileData = { name, birthdate, email };
            }
        } catch (error) {
            errors.emailError = error.message || 'Ошибка при обновлении профиля';
            this.showErrors(errors);
        }
    }

    async changePassword(payload) {
        const { oldPassword, newPassword, confirmPassword } = payload;
        const errors = {};

        if (!oldPassword || !newPassword || !confirmPassword) {
            if (!oldPassword) errors.oldPasswordError = 'Введите старый пароль';
            if (!newPassword) errors.newPasswordError = 'Введите новый пароль';
            if (!confirmPassword) errors.confirmPasswordError = 'Подтвердите новый пароль';
            this.showErrors(errors);
            return;
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPasswordError = 'пароли не совпадают';
            this.showErrors(errors);
            return;
        }

        if (newPassword === oldPassword) {
            errors.newPasswordError = 'новый пароль должен отличаться от старого';
            this.showErrors(errors);
            return;
        }

        if (newPassword.length < 6) {
            errors.newPasswordError = 'пароль должен содержать минимум 6 символов';
            this.showErrors(errors);
            return;
        }

        try {
            await AuthApi.changePassword(oldPassword, newPassword);
            document.querySelectorAll('#oldPassword, #newPassword, #confirmPassword')
                .forEach(input => { if (input) input.value = ''; });
        } catch (error) {
            errors.oldPasswordError = 'неверный пароль, попробуйте снова';
            this.showErrors(errors);
        }
    }

    async deleteAccount() {
        try {
            await AuthApi.deleteAccount();

            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: null }
            });

            window.history.pushState(null, null, '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            this.errors.generalError = 'Ошибка при удалении аккаунта';
            
            dispatcher.process({
                type: Actions.SETTINGS_ERROR,
                payload: this.errors
            });

        }
    }
}

export default new SettingsStore();
