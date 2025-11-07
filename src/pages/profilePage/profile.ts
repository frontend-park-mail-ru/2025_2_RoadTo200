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
        if (!this.parent) return console.warn('ProfilePage: parent not assigned');

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners(); 
    }

    private addEventListeners(): void {
        if (!this.parent) return;

        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: 'me' } });

        this.parent.querySelectorAll('.details__icon-edit').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const target = (e.currentTarget as HTMLElement).dataset.target;
                const type = (e.currentTarget as HTMLElement).dataset.type;
                if ((e.currentTarget as HTMLElement).classList.contains('editing') || !target) return;
                this.enableEditing(target, type || 'single-line', e.currentTarget as HTMLElement);
            });
        });

        const addPlaceholder = this.parent.querySelector('.photo-grid__add');
        if (addPlaceholder) {
            addPlaceholder.addEventListener('click', (e) => {
                e.preventDefault();
                dispatcher.process({ type: Actions.ADD_PHOTO });
            });
        }

        this.parent.querySelectorAll('.photo-grid__delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const photoCard = (e.currentTarget as HTMLElement).closest('.photo-grid__card') as HTMLElement | null;
                const photoId = photoCard?.dataset.photoId;
                if (photoId && photoId !== 'placeholder') {
                    dispatcher.process({
                        type: Actions.DELETE_PHOTO,
                        payload: { photoId }
                    });
                }
            });
        });

        const addTagButton = this.parent.querySelector('#add-interest-tag');
        if (addTagButton) {
            addTagButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (addTagButton.classList.contains('editing')) return;
                this.enableInterestAdding(addTagButton as HTMLElement);
            });
        }

        this.parent.querySelectorAll('.details__delete-layer').forEach(layer => {
            layer.addEventListener('click', (e) => {
                e.stopPropagation();
                const tag = (e.currentTarget as HTMLElement).closest('.details__tag') as HTMLElement | null;
                const interestId = tag?.dataset.interestId;
                if (interestId) {
                    console.log(interestId);
                    dispatcher.process({
                        type: Actions.DELETE_INTEREST,
                        payload: { id: parseInt(interestId) }
                    });
                }
            });
        });
    }

    private enableEditing(fieldName: string, fieldType: string, iconElement: HTMLElement): void {
        if (!this.parent) return;

        const wrapper = this.parent.querySelector(`#${fieldName}`);
        if (!wrapper) return;

        const currentTextElement = wrapper.querySelector('.details__section-text-current');
        if (!currentTextElement) return;

        const isBlockQuote = currentTextElement.tagName === 'BLOCKQUOTE';
        let currentValue = currentTextElement.textContent?.trim() || '';
        if (isBlockQuote) currentValue = currentValue.replace(/^"|"$/g, '');

        const isParagraph = fieldType === 'paragraph';
        const inputElement = document.createElement(isParagraph ? 'textarea' : 'input') as HTMLInputElement | HTMLTextAreaElement;
        inputElement.className = `details__edit-input details__edit-${isParagraph ? 'textarea' : 'single-line'}`;
        inputElement.value = currentValue;

        (currentTextElement as HTMLElement).style.display = 'none';
        wrapper.appendChild(inputElement);
        inputElement.focus();

        iconElement.dataset.type = 'save';
        iconElement.classList.add('editing');

        const cleanup = () => {
            inputElement.removeEventListener('blur', saveEdit);
            inputElement.removeEventListener('keypress', saveEdit);
            if (!inputElement.isConnected) return;
            (currentTextElement as HTMLElement).style.display = 'block';
            inputElement.remove();
            iconElement.dataset.type = fieldType;
            iconElement.classList.remove('editing');
        };

        const saveEdit = (e: Event) => {
            if (!inputElement.isConnected) return;

            const isSaveEvent = e.type === 'blur' || (e.type === 'keypress' && (e as KeyboardEvent).key === 'Enter' && fieldType === 'single-line');
            if (!isSaveEvent) return;
            if (e.type === 'keypress') e.preventDefault();

            inputElement.removeEventListener('blur', saveEdit);
            inputElement.removeEventListener('keypress', saveEdit);

            const newValue = inputElement.value.trim();

            dispatcher.process({
                type: Actions.UPDATE_PROFILE_FIELD,
                payload: { field: fieldName, value: newValue } 
            });

            currentTextElement.textContent = isBlockQuote ? `"${newValue}"` : newValue;
            cleanup();
        };

        inputElement.addEventListener('blur', saveEdit);
        inputElement.addEventListener('keypress', saveEdit);
    }

    private enableInterestAdding(addTagButton: HTMLElement): void {
        if (!this.parent) return;

        const wrapper = this.parent.querySelector('#interests-list');
        if (!wrapper) return;

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = 'new-interest-input-field';
        inputElement.placeholder = 'Введите увлечение';
        inputElement.className = 'details__tag details__new-interest-input';

        if (addTagButton.parentNode) {
            addTagButton.parentNode.insertBefore(inputElement, addTagButton);
        }
        addTagButton.style.display = 'none';
        addTagButton.classList.add('editing');
        inputElement.focus();

        const finishAdding = (e: Event) => {
            inputElement.removeEventListener('blur', finishAdding);
            inputElement.removeEventListener('keydown', finishAdding);
            if (!inputElement.isConnected) return;

            const newInterest = inputElement.value.trim();
            const shouldSave = (e.type === 'blur' || (e as KeyboardEvent).key === 'Enter') && newInterest !== '';

            if (shouldSave) {
                dispatcher.process({
                    type: Actions.ADD_INTEREST,
                    payload: { name: newInterest }
                });
            }

            inputElement.remove();
            addTagButton.style.display = 'inline-flex';
            addTagButton.classList.remove('editing');
        };

        inputElement.addEventListener('blur', finishAdding);
        inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishAdding(e);
        });
    }
}

export const profile = new ProfilePage(null);
