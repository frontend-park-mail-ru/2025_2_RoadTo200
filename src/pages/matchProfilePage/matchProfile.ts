import Handlebars from 'handlebars';

const TEMPLATE_PATH = '/src/pages/matchProfilePage/matchProfile.hbs';

interface MatchProfileData {
    id: string;
    name: string;
    age: number | null;
    description: string;
    musician: string;
    quote: string;
    interests: any[];
    photoCards: any[];
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class MatchProfilePage {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: MatchProfileData): Promise<void> {
        if (!this.parent) {
            // console.warn('MatchProfilePage: parent not assigned');
            return;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners(); 
    }

    private addEventListeners(): void {
        if (!this.parent) return;

        const chatButton = this.parent.querySelector('.match-details__chat-button');
        if (chatButton) {
            chatButton.addEventListener('click', (e) => {
                e.preventDefault();
                // console.log('Navigate to chat');
            });
        }
    }
}

export const matchProfile = new MatchProfilePage(null);
