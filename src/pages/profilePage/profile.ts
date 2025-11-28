import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

const TEMPLATE_PATH = '/src/pages/profilePage/profile.hbs';

interface ProfileData {
    description: string;
    musician: string;
    quote: string;
    name: string;
    age: string | number;
    interests: Array<{ id: number; name: string }>;
    photoCards: any[];
    userId?: string;
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class ProfilePage {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: ProfileData): Promise<void> {
        if (!this.parent) return;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners();
    }

    private addEventListeners(): void {
        if (!this.parent) return;

        this.parent.querySelectorAll('.details__icon-edit').forEach((icon) => {
            icon.addEventListener('click', (e) => {
                const target = (e.currentTarget as HTMLElement).dataset.target;
                const type = (e.currentTarget as HTMLElement).dataset.type;
                if (
                    (e.currentTarget as HTMLElement).classList.contains(
                        'editing'
                    ) ||
                    !target
                )
                    return;
                this.enableEditing(
                    target,
                    type || 'single-line',
                    e.currentTarget as HTMLElement
                );
            });
        });

        const addPlaceholder = this.parent.querySelector('.photo-grid__add');
        if (addPlaceholder) {
            addPlaceholder.addEventListener('click', (e) => {
                e.preventDefault();
                dispatcher.process({ type: Actions.ADD_PHOTO });
            });
        }

        this.parent
            .querySelectorAll('.photo-grid__delete-btn')
            .forEach((button) => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const photoCard = (e.currentTarget as HTMLElement).closest(
                        '.photo-grid__card'
                    ) as HTMLElement | null;
                    const photoId = photoCard?.dataset.photoId;
                    if (photoId && photoId !== 'placeholder') {
                        dispatcher.process({
                            type: Actions.DELETE_PHOTO,
                            payload: { photoId },
                        });
                    }
                });
            });
    }

    private enableEditing(
        fieldName: string,
        fieldType: string,
        iconElement: HTMLElement
    ): void {
        if (!this.parent) return;

        const wrapper = this.parent.querySelector(`#${fieldName}`);
        const counterElement = this.parent.querySelector(
            `.details__counter[data-counter-for="${fieldName}"]`
        ) as HTMLElement;

        if (!wrapper) return;

        let minLength = 0;
        let maxLength = 0;

        if (fieldName === 'description') {
            maxLength = 254;
        } else if (fieldName === 'musician' || fieldName === 'quote') {
            minLength = 1;
            maxLength = 50;
        }

        const currentTextElement = wrapper.querySelector(
            '.details__section-text-current'
        );
        if (!currentTextElement) return;

        const isBlockQuote = currentTextElement.tagName === 'BLOCKQUOTE';
        let currentValue = currentTextElement.textContent?.trim() || '';
        if (isBlockQuote) currentValue = currentValue.replace(/^"|"$/g, '');

        const isParagraph = fieldType === 'paragraph';
        const inputElement = document.createElement(
            isParagraph ? 'textarea' : 'input'
        ) as HTMLInputElement | HTMLTextAreaElement;

        inputElement.className = `details__edit-input details__edit-${isParagraph ? 'textarea' : 'single-line'}`;
        inputElement.value = currentValue;

        if (maxLength > 0) {
            inputElement.maxLength = maxLength;
        }


        (currentTextElement as HTMLElement).style.display = 'none';
        wrapper.appendChild(inputElement);
        inputElement.focus();

        iconElement.dataset.type = 'save';
        iconElement.classList.add('editing');

        if (counterElement) {
            counterElement.style.display = 'block';
        }


        const updateCounter = (value: string) => {
            if (!counterElement) return;
            const length = value.trim().length;

            let counterText = `${length}`;
            let isValid = true;

            if (maxLength > 0) {
                counterText += ` / ${maxLength}`;
            }

            if (minLength > 0 && length < minLength) {
                counterText += ` (Минимум ${minLength})`;
                isValid = false;
            } else if (maxLength > 0 && length > maxLength) {
                counterText += ` (Максимум ${maxLength})`;
                isValid = false;
            }

            counterElement.textContent = counterText;
            counterElement.style.color = isValid ? 'var(--color-text-subtle, #9a9a9a)' : 'red';
            return isValid;
        };

        updateCounter(currentValue);

        const cleanup = () => {
            inputElement.removeEventListener('blur', saveEdit);
            inputElement.removeEventListener('keypress', saveEdit);
            inputElement.removeEventListener('input', handleInput);

            if (!inputElement.isConnected) return;

            (currentTextElement as HTMLElement).style.display = 'block';
            inputElement.remove();
            iconElement.dataset.type = fieldType;
            iconElement.classList.remove('editing');

            if (counterElement) {
                counterElement.style.display = 'none';
            }
        };

        const saveEdit = (e: Event) => {
            if (!inputElement.isConnected) return;

            const isSaveEvent =
                e.type === 'blur' ||
                (e.type === 'keypress' &&
                    (e as KeyboardEvent).key === 'Enter' &&
                    fieldType === 'single-line');
            if (!isSaveEvent) return;
            if (e.type === 'keypress') e.preventDefault();

            const newValue = inputElement.value.trim();
            const isValid = updateCounter(newValue);

            if (!isValid && e.type === 'blur') {
                return;
            }

            if (!isValid) {
                if (e.type !== 'blur') {
                    alert(`Поле "${fieldName}" не соответствует требованиям к длине.`);
                }
                return;
            }

            inputElement.removeEventListener('blur', saveEdit);
            inputElement.removeEventListener('keypress', saveEdit);
            inputElement.removeEventListener('input', handleInput);


            dispatcher.process({
                type: Actions.UPDATE_PROFILE_FIELD,
                payload: { field: fieldName, value: newValue },
            });

            currentTextElement.textContent = isBlockQuote
                ? `"${newValue}"`
                : newValue;
            cleanup();
        };

        const handleInput = () => {
            updateCounter(inputElement.value);
        };

        inputElement.addEventListener('input', handleInput);
        inputElement.addEventListener('blur', saveEdit);
        inputElement.addEventListener('keypress', saveEdit);
    }


}

export const profile = new ProfilePage(null);
