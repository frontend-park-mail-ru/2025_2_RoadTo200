import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

const TEMPLATE_PATH = './src/pages/profilePage/profile.hbs';

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class ProfilePage {
    parent = null;

    constructor(parent) {
        this.parent = parent;
    }

    async render(data) {
        if (!this.parent) return console.warn('ProfilePage: parent not assigned');

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners(); 
    }

    addEventListeners() {
        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: 'me' } });

        this.parent.querySelectorAll('.edit-icon-small').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const { target: fieldName, type: fieldType } = e.currentTarget.dataset;
                if (e.currentTarget.classList.contains('editing') || !fieldName) return;
                this.enableEditing(fieldName, fieldType, e.currentTarget);
            });
        });

        const addPlaceholder = this.parent.querySelector('.add-photo-placeholder');
        if (addPlaceholder) {
            addPlaceholder.addEventListener('click', (e) => {
                e.preventDefault();
                dispatcher.process({ type: Actions.ADD_PHOTO });
            });
        }

        this.parent.querySelectorAll('.delete-photo-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const photoCard = e.currentTarget.closest('.photo-card');
                const photoId = photoCard?.dataset.photoId;
                if (photoId) {
                    dispatcher.process({
                        type: Actions.DELETE_PHOTO,
                        payload: { photoId: parseInt(photoId) }
                    });
                }
            });
        });

        const addTagButton = this.parent.querySelector('#add-interest-tag');
        if (addTagButton) {
            addTagButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (addTagButton.classList.contains('editing')) return;
                this.enableInterestAdding(addTagButton);
            });
        }

        this.parent.querySelectorAll('.delete-interest-layer').forEach(layer => {
            layer.addEventListener('click', (e) => {
                e.stopPropagation();
                const tag = e.currentTarget.closest('.interest-tag');
                const interestId = tag?.dataset.interestId;
                if (interestId) {
                    dispatcher.process({
                        type: Actions.DELETE_INTEREST,
                        payload: { id: parseInt(interestId) }
                    });
                }
            });
        });
    }

    enableEditing(fieldName, fieldType, iconElement) {
        const wrapper = this.parent.querySelector(`#${fieldName}`);
        if (!wrapper) return;

        const currentTextElement = wrapper.querySelector('.current-text');
        if (!currentTextElement) return;

        const isBlockQuote = currentTextElement.tagName === 'BLOCKQUOTE';
        let currentValue = currentTextElement.textContent.trim();
        if (isBlockQuote) currentValue = currentValue.replace(/^"|"$/g, '');

        const isParagraph = fieldType === 'paragraph';
        const inputElement = document.createElement(isParagraph ? 'textarea' : 'input');
        inputElement.className = `edit-input edit-${isParagraph ? 'textarea' : 'single-line'}`;
        inputElement.value = currentValue;

        currentTextElement.style.display = 'none';
        wrapper.appendChild(inputElement);
        inputElement.focus();

        iconElement.dataset.type = 'save';
        iconElement.classList.add('editing');

        const cleanup = () => {
            inputElement.removeEventListener('blur', saveEdit);
            inputElement.removeEventListener('keypress', saveEdit);
            if (!inputElement.isConnected) return;
            currentTextElement.style.display = 'block';
            inputElement.remove();
            iconElement.dataset.type = fieldType;
            iconElement.classList.remove('editing');
        };

        const saveEdit = (e) => {
            if (!inputElement.isConnected) return;

            const isSaveEvent = e.type === 'blur' || (e.type === 'keypress' && e.key === 'Enter' && fieldType === 'single-line');
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

    enableInterestAdding(addTagButton) {
        const wrapper = this.parent.querySelector('#interests-list');
        if (!wrapper) return;

        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.id = 'new-interest-input-field';
        inputElement.placeholder = 'Введите увлечение';
        inputElement.className = 'interest-tag new-interest-input';

        addTagButton.parentNode.insertBefore(inputElement, addTagButton);
        addTagButton.style.display = 'none';
        addTagButton.classList.add('editing');
        inputElement.focus();

        const finishAdding = (e) => {
            inputElement.removeEventListener('blur', finishAdding);
            inputElement.removeEventListener('keydown', finishAdding);
            if (!inputElement.isConnected) return;

            const newInterest = inputElement.value.trim();
            const shouldSave = (e.type === 'blur' || e.key === 'Enter') && newInterest !== '';

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
