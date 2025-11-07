import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import MatchCard from '../../components/MatchCard/matchCard.js';

const TEMPLATE_PATH = '/src/pages/matchesPage/matches.hbs';

const fetchTemplate = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class MatchesPage {
    parent = null;

    matchesData = [];

    constructor(parent) {
        this.parent = parent;
    }

    async render() {
        if (!this.parent) {
            console.warn('MatchesPage: parent not assigned');
            return;
        }

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const matchCardsHtml = await Promise.all(
            this.matchesData.map(match => MatchCard.render(match))
        );

        // Объединяем массив HTML-строк в одну строку
        const matchesHtmlString = matchCardsHtml.join('');

        const renderedHtml = pageTemplate({
            matchesHtml: matchesHtmlString,
            noMatches: this.matchesData.length === 0
        });

        this.parent.innerHTML = renderedHtml;
        this.addEventListeners();
        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: 'matches' } });
    }

    addEventListeners() {
        const matchCards = this.parent.querySelectorAll('.match-card');
        matchCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const matchId = card.dataset.matchId;
                if (!matchId) return;
                
                // Находим полные данные матча из matchesData
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

    async setMatches(matchesArr) {
        this.matchesData = Array.isArray(matchesArr) ? matchesArr : Object.values(matchesArr || []);
        await this.render();
    }
}

export const matches = new MatchesPage(null);
