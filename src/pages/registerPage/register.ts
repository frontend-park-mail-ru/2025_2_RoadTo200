import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions, type Action } from '@/actions';

const TEMPLATE_PATH = './src/pages/registerPage/register.hbs';

function validateEmail(email: string): boolean {
    const emailRegex =
        /^[a-zA-Z0-9._%+\-\u0080-\uFFFF]+@[a-zA-Z0-9.\-\u0080-\uFFFF]+\.[a-zA-Z\u0080-\uFFFF]{2,}$/;
    return emailRegex.test(email);
}

function showError(message: string): void {
    const errorElement = document.getElementById('registerError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(): void {
    const errorElement = document.getElementById('registerError');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    const allInputs = document.querySelectorAll('.form__error-input');
    allInputs.forEach((input) => {
        input.classList.remove('form__error-input');
    });
}

async function fetchTemplate(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
    }
    return response.text();
}

export class RegisterPage {
    private parent: HTMLElement;

    constructor(parent: HTMLElement) {
        this.parent = parent;
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        if (action.type === Actions.REGISTER_ERROR) {
            if (typeof action.payload === 'string') {
                showError(action.payload);
            } else {
                showError('Ошибка регистрации');
            }
        }
    }

    async render(): Promise<void> {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);

        const newDiv = document.createElement('div');
        newDiv.id = 'registerDiv';

        const pageTemplate = Handlebars.compile(pageTemplateString);
        newDiv.innerHTML = pageTemplate({});
        this.parent.appendChild(newDiv);

        this.initPasswordToggles();
        this.initFormActions();

        // После того как страница отрендерена, показываем фон
        // Используем двойной requestAnimationFrame для гарантии применения стилей
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                dispatcher.process({ type: Actions.RENDER_AUTH_BACKGROUND });
            });
        });
    }

    private initPasswordToggles(): void {
        const toggleButtons = document.querySelectorAll(
            '.form__password-toggle'
        );

        toggleButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const wrapper = button.closest('.form__password-wrapper');
                if (!wrapper) return;

                const input = wrapper.querySelector('input');
                const icon = button.querySelector(
                    '.eye-icon'
                ) as HTMLImageElement | null;

                if (!input || !icon) return;

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.src = './src/assets/Eyes/open_eye.svg';
                    icon.alt = 'Скрыть пароль';
                } else {
                    input.type = 'password';
                    icon.src = './src/assets/Eyes/close_eye.svg';
                    icon.alt = 'Показать пароль';
                }
            });
        });
    }

    private handleRegister = async (event: Event): Promise<void> => {
        event.preventDefault();

        clearError();

        const emailInput = document.getElementById(
            'email'
        ) as HTMLInputElement | null;
        const passwordInput = document.getElementById(
            'password'
        ) as HTMLInputElement | null;
        const passwordConfirmInput = document.getElementById(
            'passwordConfirm'
        ) as HTMLInputElement | null;

        if (!emailInput || !passwordInput || !passwordConfirmInput) {
            showError('Форма не найдена');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        // Проверка на пустые поля
        if (!email) {
            emailInput.classList.add('form__error-input');
            showError('Введите email');
            return;
        }

        if (!password) {
            passwordInput.classList.add('form__error-input');
            showError('Введите пароль');
            return;
        }

        if (!passwordConfirm) {
            passwordConfirmInput.classList.add('form__error-input');
            showError('Подтвердите пароль');
            return;
        }

        // Валидация email
        if (!validateEmail(email)) {
            emailInput.classList.add('form__error-input');
            showError('Некорректный email');
            return;
        }

        // Валидация пароля
        if (password.length < 6) {
            passwordInput.classList.add('form__error-input');
            showError('Пароль должен содержать минимум 6 символов');
            return;
        }

        // Проверка совпадения паролей
        if (password !== passwordConfirm) {
            passwordInput.classList.add('form__error-input');
            passwordConfirmInput.classList.add('form__error-input');
            showError('Пароли не совпадают');
            return;
        }

        await dispatcher.process({
            type: Actions.REQUEST_REGISTER,
            payload: { email, password, passwordConfirm },
        });
    };

    private initFormActions(): void {
        const form = document.getElementById('registerForm');

        if (form) {
            form.removeEventListener('submit', this.handleRegister);
            form.addEventListener('submit', this.handleRegister);
        }
    }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}
export const register = new RegisterPage(rootElement);
