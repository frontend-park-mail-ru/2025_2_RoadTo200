import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

const TEMPLATE_PATH = '/src/pages/settingsPage/settings.hbs';

interface ProfileData {
    name?: string;
    birthdate?: string;
    email?: string;
    preferences?: {
        show_gender?: string;
        age_min?: number;
        age_max?: number;
        max_distance?: number;
        global_search?: boolean;
    };
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон настроек');
    return response.text();
};

export class SettingsPage {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(profileData: ProfileData = {}, currentTab: string = 'profile'): Promise<void> {
        if (!this.parent) {
            console.warn('SettingsPage: parent not assigned');
            return;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate({});

        this.renderContent(currentTab, profileData);

        await dispatcher.process({
            type: Actions.RENDER_SETTINGS_MENU,
            payload: { tab: currentTab }
        });
    }

    renderContent(currentTab: string, profileData: ProfileData = {}): void {
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

    private createProfileTab(profileData: ProfileData): HTMLDivElement {
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

    private createSecurityTab(): HTMLDivElement {
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

    private createFiltersTab(profileData: ProfileData): HTMLDivElement {
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

            <div class="checkbox-group">
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="globalSearch" ${preferences.global_search ? 'checked' : ''} />
                    Глобальный поиск (игнорировать расстояние)
                </label>
            </div>
            </div>

            <button class="btn-primary" id="updateFiltersBtn">Сохранить фильтры</button>
        `;
        return section;
    }

    private static createFormGroupHTML(label: string, type: string, id: string, value: string | undefined, errorId: string, placeholder: string = ''): string {
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

    private attachEventListeners(currentTab: string): void {
        if (!this.parent) return;

        if (currentTab === 'profile') {
            // Добавляем автоформатирование даты рождения
            const birthdateInput = this.parent.querySelector('#settingsBirthdate') as HTMLInputElement | null;
            if (birthdateInput) {
                birthdateInput.addEventListener('input', (e) => {
                    const input = e.target as HTMLInputElement;
                    let value = input.value.replace(/\D/g, ''); // Оставляем только цифры
                    
                    // Ограничиваем до 8 цифр
                    if (value.length > 8) {
                        value = value.slice(0, 8);
                    }
                    
                    // Форматируем с точками
                    let formatted = '';
                    if (value.length > 0) {
                        formatted = value.slice(0, 2);
                    }
                    if (value.length >= 3) {
                        formatted += '.' + value.slice(2, 4);
                    }
                    if (value.length >= 5) {
                        formatted += '.' + value.slice(4, 8);
                    }
                    
                    input.value = formatted;
                });
            }

            const updateBtn = this.parent.querySelector('#updateProfileBtn');
            if (updateBtn) {
                updateBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const nameInput = this.parent?.querySelector('#settingsName') as HTMLInputElement | null;
                    const birthdateInput = this.parent?.querySelector('#settingsBirthdate') as HTMLInputElement | null;
                    const emailInput = this.parent?.querySelector('#settingsEmail') as HTMLInputElement | null;
                    
                    dispatcher.process({
                        type: Actions.UPDATE_PROFILE_SETTINGS,
                        payload: {
                            name: nameInput?.value.trim(),
                            birthdate: birthdateInput?.value.trim(),
                            email: emailInput?.value.trim(),
                        },
                    });
                });
            }
        } else if (currentTab === 'filters') {
            const updateFiltersBtn = this.parent.querySelector('#updateFiltersBtn');
            if (updateFiltersBtn) {
                updateFiltersBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showGenderInput = this.parent?.querySelector('#showGender') as HTMLSelectElement | null;
                    const ageMinInput = this.parent?.querySelector('#ageMin') as HTMLInputElement | null;
                    const ageMaxInput = this.parent?.querySelector('#ageMax') as HTMLInputElement | null;
                    const maxDistanceInput = this.parent?.querySelector('#maxDistance') as HTMLInputElement | null;
                    const globalSearchInput = this.parent?.querySelector('#globalSearch') as HTMLInputElement | null;
                    
                    dispatcher.process({
                        type: Actions.UPDATE_FILTER_SETTINGS,
                        payload: {
                            show_gender: showGenderInput?.value,
                            age_min: ageMinInput ? parseInt(ageMinInput.value, 10) : undefined,
                            age_max: ageMaxInput ? parseInt(ageMaxInput.value, 10) : undefined,
                            max_distance: maxDistanceInput ? parseInt(maxDistanceInput.value, 10) : undefined,
                            global_search: globalSearchInput?.checked,
                        },
                    });
                });
            }
        } else if (currentTab === 'security') {
            const changePasswordBtn = this.parent.querySelector('#changePasswordBtn');
            if (changePasswordBtn) {
                changePasswordBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const oldPasswordInput = this.parent?.querySelector('#oldPassword') as HTMLInputElement | null;
                    const newPasswordInput = this.parent?.querySelector('#newPassword') as HTMLInputElement | null;
                    const confirmPasswordInput = this.parent?.querySelector('#confirmPassword') as HTMLInputElement | null;
                    
                    dispatcher.process({
                        type: Actions.CHANGE_PASSWORD,
                        payload: {
                            oldPassword: oldPasswordInput?.value,
                            newPassword: newPasswordInput?.value,
                            confirmPassword: confirmPasswordInput?.value,
                        },
                    });
                });
            }

            const deleteAccountBtn = this.parent.querySelector('#deleteAccountBtn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Удалить аккаунт? Это действие необратимо.')) {
                        dispatcher.process({ type: Actions.DELETE_ACCOUNT });
                    }
                });
            }
        }
    }

    showErrors(errors: Record<string, string>): void {
        if (!this.parent) return;

        Object.entries(errors).forEach(([key, message]) => {
            const errorElement = this.parent?.querySelector(`#${key}`);
            if (errorElement) errorElement.textContent = message;
            const inputElement = this.parent?.querySelector(`#${key.replace('Error', '')}`) as HTMLElement | null;
            if (inputElement) inputElement.classList.add('error-input');
        });
    }

    clearErrors(): void {
        if (!this.parent) return;

        this.parent.querySelectorAll('.error-message').forEach((el) => {
            el.textContent = '';
        });
        this.parent.querySelectorAll('.form-input').forEach((input) => {
            input.classList.remove('error-input');
        });
    }
}

export const settings = new SettingsPage(null);
