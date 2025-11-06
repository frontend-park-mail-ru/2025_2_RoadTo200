import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

/* global Handlebars */

const TEMPLATE_PATH = '/src/pages/matchProfilePage/matchProfile.hbs';

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    const text = await response.text();
    return text;
};

export class MatchProfilePage {
    parent = null;

    constructor(parent) {
        this.parent = parent;
    }

    async render(data) {
        if (!this.parent) {
            console.warn('MatchProfilePage: parent not assigned');
            return;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners(); 
    }

    addEventListeners() {
        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: 'matches' } });

        const chatButton = this.parent.querySelector('.chat-button');
        if (chatButton) {
            chatButton.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Implement chat navigation
                console.log('Navigate to chat');
            });
        }
    }
}

export const matchProfile = new MatchProfilePage(null);
