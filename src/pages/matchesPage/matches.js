import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import MatchCard from '../../components/MatchCard/matchCard.js';

const TEMPLATE_PATH = '/src/pages/matchesPage/matches.hbs';
const EMPTY_STATE_TEMPLATE_PATH = '/src/components/EmptyState/emptyState.hbs';

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

        console.log('MatchesPage render called, matchesData length:', this.matchesData.length);

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        let contentHtml;
        if (this.matchesData.length === 0) {
            console.log('No matches - rendering empty state');
            const emptyStateTemplateString = await fetchTemplate(EMPTY_STATE_TEMPLATE_PATH);
            const emptyStateTemplate = Handlebars.compile(emptyStateTemplateString);
            contentHtml = emptyStateTemplate({
                icon: '💔',
                title: 'Пока нет мэтчей',
                message: 'Понравьтесь кому-нибудь, чтобы увидеть мэтчи здесь',
                buttonText: 'Смотреть анкеты',
                buttonId: 'goToCards'
            });
        } else {
            console.log('Rendering', this.matchesData.length, 'matches');
            console.log('First match data:', this.matchesData[0]);
            const matchCardsHtml = await Promise.all(
                this.matchesData.map(match => MatchCard.render(match))
            );
            console.log('Match cards HTML generated, first card:', matchCardsHtml[0].substring(0, 200));
            contentHtml = matchCardsHtml.join('');
        }

        const renderedHtml = pageTemplate({
            matchesHtml: this.matchesData.length > 0 ? contentHtml : '',
            emptyState: this.matchesData.length === 0 ? contentHtml : '',
            noMatches: this.matchesData.length === 0
        });

        console.log('Final rendered HTML length:', renderedHtml.length);
        console.log('Has matches class:', renderedHtml.includes('match-card'));

        this.parent.innerHTML = renderedHtml;
        
        if (this.matchesData.length === 0) {
            const cardsButton = document.getElementById('goToCards');
            if (cardsButton) {
                cardsButton.addEventListener('click', () => {
                    window.history.pushState({ route: 'cards' }, null, '/cards');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                });
            }
        } else {
            this.addEventListeners();
        }
        
        dispatcher.process({ type: Actions.RENDER_MENU, payload: { route: 'matches' } });
    }

    addEventListeners() {
        const matchCards = this.parent.querySelectorAll('.match-card');
        matchCards.forEach((card, index) => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const matchId = card.dataset.matchId;
                if (!matchId) return;
                
                // Находим полные данные матча из matchesData
                const matchData = this.matchesData.find(m => m.id === matchId || m.matchId === matchId);
                
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
        console.log('setMatches called with:', this.matchesData);
        await this.render();
    }
}

export const matches = new MatchesPage(null);
