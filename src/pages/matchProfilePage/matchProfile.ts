import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
import { reportPopup } from '@/components/ReportPopup/reportPopup';
import cardApi from '@/apiHandler/cardApi';
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
    isPremium?: boolean;
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

                setTimeout(() => {
                    dispatcher.process({
                        type: Actions.SELECT_CHAT,
                        payload: {
                            chatId: this.currentData!.matchId,
                            userName: this.currentData!.name,
                            userPhoto: this.currentData!.heroPhoto,
                        },
                    });
                }, 300);
            });
        }

        const likeBackButton = this.parent.querySelector(
            '[data-action="like-back"]'
        ) as HTMLButtonElement | null;
        if (likeBackButton && this.currentData?.userId) {
            likeBackButton.addEventListener('click', async (event) => {
                event.preventDefault();
                const userId = this.currentData?.userId;
                if (!userId) return;

                likeBackButton.disabled = true;
                likeBackButton.textContent = 'Отправка...';

                try {
                    const response = await cardApi.postCardInteraction(userId, 'like');
                    
                    if (response.is_match) {
                        likeBackButton.textContent = 'Это мэтч!';
                        setTimeout(() => {
                            dispatcher.process({
                                type: Actions.NAVIGATE_TO,
                                payload: { path: '/matches' },
                            });
                        }, 1500);
                    } else {
                        likeBackButton.textContent = 'Лайк отправлен!';
                        setTimeout(() => {
                            dispatcher.process({
                                type: Actions.NAVIGATE_TO,
                                payload: { path: '/matches' },
                            });
                        }, 1500);
                    }
                } catch (error) {
                    likeBackButton.disabled = false;
                    likeBackButton.textContent = 'Лайкнуть в ответ';
                }
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
                    context: 'match',
                });
            });
        }
    }
}

export const matchProfile = new MatchProfilePage(null);
