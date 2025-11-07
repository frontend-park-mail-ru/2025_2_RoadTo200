import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

const TEMPLATE_PATH = '/src/pages/settingsPage/settings.hbs';

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон настроек');
    return response.text();
};

export class SettingsPage {
    constructor(parent) {
        this.parent = parent;
    }

    async render(profileData = {}, currentTab = 'profile') {
        if (!this.parent) {
            console.warn('SettingsPage: parent not assigned');
            return;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        // eslint-disable-next-line no-undef
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate({});

        this.renderContent(currentTab, profileData);

        dispatcher.process({
            type: Actions.RENDER_SETTINGS_MENU,
            payload: { tab: currentTab }
        });
    }

    renderContent(currentTab, profileData = {}) {
        const contentContainer = this.parent?.querySelector('#settingsContent');
        if (!contentContainer) {
            return;
        }

        contentContainer.innerHTML = '';

        switch (currentTab) {
            case 'profile':
                contentContainer.appendChild(this.createProfileTab(profileData));
                break;
            case 'filters':
                contentContainer.appendChild(this.createFiltersTab(profileData));
                break;
            case 'security':
                contentContainer.appendChild(this.createSecurityTab());
                break;
            default:
                console.warn('Unknown settings tab:', currentTab);
                break;
        }

        this.attachEventListeners(currentTab);
    }

    createProfileTab(profileData) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h1 class="settings-section-title">Профиль</h1>
            ${SettingsPage.createFormGroupHTML('Имя:', 'text', 'settingsName', profileData.name, 'settingsNameError')}
            ${SettingsPage.createFormGroupHTML('Дата рождения:', 'text', 'settingsBirthdate', profileData.birthdate, 'birthdateError', 'ДД.ММ.ГГГГ')}
            ${SettingsPage.createFormGroupHTML('Email:', 'email', 'settingsEmail', profileData.email, 'emailError')}
            <button class="btn-primary" id="updateProfileBtn">Обновить настройки</button>
        `;
        return section;
    }

    createSecurityTab() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h1 class="settings-section-title">Безопасность</h1>
            ${SettingsPage.createFormGroupHTML('Введите старый пароль:', 'password', 'oldPassword', '', 'oldPasswordError')}
            ${SettingsPage.createFormGroupHTML('Введите новый пароль:', 'password', 'newPassword', '', 'newPasswordError')}
            ${SettingsPage.createFormGroupHTML('Введите новый пароль повторно:', 'password', 'confirmPassword', '', 'confirmPasswordError')}
            <button class="btn-primary" id="changePasswordBtn">Сменить пароль</button>
            <div class="divider"></div>
            <button class="btn-danger" id="deleteAccountBtn">Удалить аккаунт</button>
        `;
        return section;
    }

    createFiltersTab(profileData) {
        const preferences = profileData.preferences || {};
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h1 class="settings-section-title">Фильтры поиска</h1>
            
            <div class="form-group">
                <label class="form-label">Показывать мне:</label>
                <select class="form-input" id="showGender">
                    <option value="male" ${preferences.show_gender === 'male' ? 'selected' : ''}>Мужчин</option>
                    <option value="female" ${preferences.show_gender === 'female' ? 'selected' : ''}>Женщин</option>
                    <option value="both" ${preferences.show_gender === 'both' || !preferences.show_gender ? 'selected' : ''}>Всех</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Возраст от:</label>
                <input type="number" class="form-input" id="ageMin" value="${preferences.age_min || 18}" min="18" max="100" />
            </div>

            <div class="form-group">
                <label class="form-label">Возраст до:</label>
                <input type="number" class="form-input" id="ageMax" value="${preferences.age_max || 50}" min="18" max="100" />
            </div>

            <div class="form-group">
                <label class="form-label">Максимальное расстояние (км):</label>
                <input type="number" class="form-input" id="maxDistance" value="${preferences.max_distance || 100}" min="1" max="10000" />
            </div>

            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="globalSearch" ${preferences.global_search ? 'checked' : ''} />
                    Глобальный поиск (игнорировать расстояние)
                </label>
            </div>

            <button class="btn-primary" id="updateFiltersBtn">Сохранить фильтры</button>
        `;
        return section;
    }

    static createFormGroupHTML(label, type, id, value, errorId, placeholder = '') {
        const placeholderAttr = placeholder ? `placeholder="${placeholder}"` : '';
        return `
            <div class="form-group">
                <label class="form-label">${label}</label>
                <div class="input-wrapper">
                    <input type="${type}" class="form-input" id="${id}" value="${value || ''}" ${placeholderAttr}/>
                </div>
                <p class="error-message" id="${errorId}"></p>
            </div>
        `;
    }

    attachEventListeners(currentTab) {
        if (currentTab === 'profile') {
            const updateBtn = this.parent.querySelector('#updateProfileBtn');
            if (updateBtn) {
                updateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    dispatcher.process({
                        type: Actions.UPDATE_PROFILE_SETTINGS,
                        payload: {
                            name: this.parent.querySelector('#settingsName')?.value.trim(),
                            birthdate: this.parent.querySelector('#settingsBirthdate')?.value.trim(),
                            email: this.parent.querySelector('#settingsEmail')?.value.trim(),
                        },
                    });
                });
            }
        } else if (currentTab === 'filters') {
            const updateFiltersBtn = this.parent.querySelector('#updateFiltersBtn');
            if (updateFiltersBtn) {
                updateFiltersBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    dispatcher.process({
                        type: Actions.UPDATE_FILTER_SETTINGS,
                        payload: {
                            show_gender: this.parent.querySelector('#showGender')?.value,
                            age_min: parseInt(this.parent.querySelector('#ageMin')?.value, 10),
                            age_max: parseInt(this.parent.querySelector('#ageMax')?.value, 10),
                            max_distance: parseInt(this.parent.querySelector('#maxDistance')?.value, 10),
                            global_search: this.parent.querySelector('#globalSearch')?.checked,
                        },
                    });
                });
            }
        } else if (currentTab === 'security') {
            const changePasswordBtn = this.parent.querySelector('#changePasswordBtn');
            if (changePasswordBtn) {
                changePasswordBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    dispatcher.process({
                        type: Actions.CHANGE_PASSWORD,
                        payload: {
                            oldPassword: this.parent.querySelector('#oldPassword')?.value,
                            newPassword: this.parent.querySelector('#newPassword')?.value,
                            confirmPassword: this.parent.querySelector('#confirmPassword')?.value,
                        },
                    });
                });
            }

            const deleteAccountBtn = this.parent.querySelector('#deleteAccountBtn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // eslint-disable-next-line no-alert
                    if (confirm('Удалить аккаунт? Это действие необратимо.')) {
                        dispatcher.process({ type: Actions.DELETE_ACCOUNT });
                    }
                });
            }
        }
    }

    showErrors(errors) {
        Object.entries(errors).forEach(([key, message]) => {
            const errorElement = this.parent.querySelector(`#${key}`);
            if (errorElement) errorElement.textContent = message;
            const inputElement = this.parent.querySelector(`#${key.replace('Error', '')}`);
            if (inputElement) inputElement.classList.add('error-input');
        });
    }

    clearErrors() {
        this.parent.querySelectorAll('.error-message').forEach((el) => {
            // eslint-disable-next-line no-param-reassign
            el.textContent = '';
        });
        this.parent.querySelectorAll('.form-input').forEach((input) => {
            input.classList.remove('error-input');
        });
    }
}

export const settings = new SettingsPage(null);

