import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
import { reportPopup } from '@/components/ReportPopup/reportPopup';

const TEMPLATE_PATH = '/src/pages/matchProfilePage/matchProfile.hbs';

interface MatchProfileData {
    id: string;
    matchId: string;
    userId: string;
    name: string;
    age: number | null;
    description: string;
    musician: string;
    quote: string;
    interests: any[];
    photoCards: any[];
    heroPhoto?: string;
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class MatchProfilePage {
    parent: HTMLElement | null = null;
    private currentData: MatchProfileData | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: MatchProfileData): Promise<void> {
        if (!this.parent) {
            // console.warn('MatchProfilePage: parent not assigned');
            return;
        }

        this.currentData = data;
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        this.addEventListeners();
    }

    private addEventListeners(): void {
        if (!this.parent || !this.currentData) return;

        const chatButton = this.parent.querySelector(
            '[data-action="open-chat"]'
        ) as HTMLButtonElement | null;
        if (chatButton) {
            chatButton.addEventListener('click', (event) => {
                event.preventDefault();
                if (!this.currentData?.matchId) return;

                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/chats' },
                });

                dispatcher.process({
                    type: Actions.SELECT_CHAT,
                    payload: {
                        chatId: this.currentData.matchId,
                        userName: this.currentData.name,
                        userPhoto: this.currentData.heroPhoto,
                    },
                });
            });
        }

        const reportButton = this.parent.querySelector(
            '[data-report-open]'
        ) as HTMLButtonElement | null;
        if (reportButton && this.currentData.userId) {
            reportButton.addEventListener('click', (event) => {
                event.preventDefault();
                reportPopup.show({
                    targetUserId: this.currentData?.userId || '',
                    targetName: this.currentData?.name,
                    targetAge: this.currentData?.age || undefined,
                });
            });
        }
    }
}

export const matchProfile = new MatchProfilePage(null);
