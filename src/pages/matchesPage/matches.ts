import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
import MatchCard from '@/components/MatchCard/matchCard';

const TEMPLATE_PATH = '/src/pages/matchesPage/matches.hbs';

interface MatchData {
    matchId: string;
    id: string;
    name: string;
    age: number | null;
    image: string;
    matchedAt: string;
    expiresAt: string;
    isNew: boolean;
    isActive: boolean;
    timer?: string;
    isExpired?: boolean;
    userData?: any;
}

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class MatchesPage {
    parent: HTMLElement | null = null;
    matchesData: MatchData[] = [];

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(): Promise<void> {
        if (!this.parent) {
            console.warn('MatchesPage: parent not assigned');
            return;
        }

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const matchCardsHtml = await Promise.all(
            this.matchesData.map(match => MatchCard.render(match))
        );

        const matchesHtmlString = matchCardsHtml.join('');

        const renderedHtml = pageTemplate({
            matchesHtml: matchesHtmlString,
            noMatches: this.matchesData.length === 0
        });

        this.parent.innerHTML = renderedHtml;
        this.addEventListeners();
    }

    private addEventListeners(): void {
        if (!this.parent) return;

        const matchCards = this.parent.querySelectorAll('.match-card');
        matchCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const matchId = (card as HTMLElement).dataset.matchId;
                if (!matchId) return;
                
                const matchData = this.matchesData.find(m => m.matchId === matchId || m.id === matchId);
                
                dispatcher.process({
                    type: Actions.MATCH_CARD_CLICK,
                    payload: { 
                        matchId,
                        userData: matchData ? matchData.userData : null
                    }
                });
            });
        });
    }

    async setMatches(matchesArr: MatchData[] | Record<string, MatchData>): Promise<void> {
        this.matchesData = Array.isArray(matchesArr) ? matchesArr : Object.values(matchesArr || {});
        await this.render();
    }
}

export const matches = new MatchesPage(null);
