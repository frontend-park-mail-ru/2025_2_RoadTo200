import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import { settingsMenu } from '../../components/SettingsMenu/settingsMenu.js';

const TEMPLATE_PATH = './src/pages/settingsPage/settings.hbs';

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон настроек');
    return response.text();
};

export class SettingsPage {
    parent = null;

    constructor(parent) {
        this.parent = parent;
        dispatcher.register(this);
    }

    async handleAction(action) {
        if (action.type === Actions.SETTINGS_RENDER_CONTENT) {
            this.renderContent(action.payload);
        }
    }

    renderContent(payload) {
        const contentContainer = this.parent?.querySelector('#settingsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = '';
        
        if (payload.currentTab === 'profile') {
            contentContainer.appendChild(this.createProfileTab(payload.profileData));
        } else if (payload.currentTab === 'security') {
            contentContainer.appendChild(this.createSecurityTab());
        }

        this.attachEventListeners(payload.currentTab);
    }

    createProfileTab(profileData) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h1 class="settings-section-title">Профиль</h1>
            ${this.createFormGroupHTML('Имя:', 'text', 'settingsName', profileData.name, 'settingsNameError')}
            ${this.createFormGroupHTML('Дата рождения:', 'text', 'settingsBirthdate', profileData.birthdate, 'birthdateError', 'ДД.ММ.ГГГГ')}
            ${this.createFormGroupHTML('Email:', 'email', 'settingsEmail', profileData.email, 'emailError')}
            <button class="btn-primary" id="updateProfileBtn">Обновить настройки</button>
        `;
        return section;
    }

    createSecurityTab() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h1 class="settings-section-title">Безопасность</h1>
            <h2 class="settings-subsection-title">Смена пароля</h2>
            ${this.createFormGroupHTML('Введите старый пароль:', 'password', 'oldPassword', '', 'oldPasswordError')}
            ${this.createFormGroupHTML('Введите новый пароль:', 'password', 'newPassword', '', 'newPasswordError')}
            ${this.createFormGroupHTML('Введите новый пароль повторно:', 'password', 'confirmPassword', '', 'confirmPasswordError')}
            <button class="btn-primary" id="changePasswordBtn">Сменить пароль</button>
            <div class="divider"></div>
            <button class="btn-danger" id="deleteAccountBtn">Удалить аккаунт</button>
        `;
        return section;
    }

    createFormGroupHTML(label, type, id, value, errorId, placeholder = '') {
        return `
            <div class="form-group">
                <label class="form-label">${label}</label>
                <div class="input-wrapper">
                    <input type="${type}" class="form-input" id="${id}" value="${value || ''}" ${placeholder ? `placeholder="${placeholder}"` : ''} />
                </div>
                <p class="error-message" id="${errorId}"></p>
            </div>
        `;
    }

    async render(data) {
        if (!this.parent) return;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate({});

        const menuContainer = this.parent.querySelector('#settingsMenuContainer');
        if (menuContainer) {
            settingsMenu.parent = menuContainer;
            await settingsMenu.render({ currentTab: data.currentTab });
        }

        dispatcher.process({
            type: Actions.SETTINGS_RENDER_CONTENT,
            payload: { currentTab: data.currentTab, profileData: data.profile || {} }
        });
    }

    attachEventListeners(currentTab) {
        if (currentTab === 'profile') {
            this.parent.querySelector('#updateProfileBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                dispatcher.process({ type: Actions.SETTINGS_CLEAR_ERRORS });
                dispatcher.process({
                    type: Actions.UPDATE_PROFILE_SETTINGS,
                    payload: {
                        name: this.parent.querySelector('#settingsName')?.value.trim(),
                        birthdate: this.parent.querySelector('#settingsBirthdate')?.value.trim(),
                        email: this.parent.querySelector('#settingsEmail')?.value.trim()
                    }
                });
            });
        } else {
            this.parent.querySelector('#changePasswordBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                dispatcher.process({ type: Actions.SETTINGS_CLEAR_ERRORS });
                dispatcher.process({
                    type: Actions.CHANGE_PASSWORD,
                    payload: {
                        oldPassword: this.parent.querySelector('#oldPassword')?.value,
                        newPassword: this.parent.querySelector('#newPassword')?.value,
                        confirmPassword: this.parent.querySelector('#confirmPassword')?.value
                    }
                });
            });

            this.parent.querySelector('#deleteAccountBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
                    dispatcher.process({ type: Actions.DELETE_ACCOUNT });
                }
            });
        }
    }
}

export const settings = new SettingsPage(null);
