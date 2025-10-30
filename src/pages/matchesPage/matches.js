import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import MatchCard from '../../components/MatchCard/matchCard.js';

const TEMPLATE_PATH = './src/pages/matchesPage/matches.hbs';

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading template:', error);
        return '<h1>Ошибка: Не удалось загрузить шаблон</h1>'; 
    }
};

export class MatchesPage {
    parent;
    matchesData;
    timers;

    constructor(parent) {
        this.parent = parent;
        this.matchesData = [];
        this.timers = [];
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const matchCardsHtml = [];
        
        for (const match of this.matchesData) {
            const cardHtml = await MatchCard.render(match);
            matchCardsHtml.push(cardHtml);
        }

        const renderedHtml = pageTemplate({
            matches: matchCardsHtml,
            noMatches: this.matchesData.length === 0
        });

        const newDiv = document.createElement('div');
        newDiv.id = 'matchesDiv';
        newDiv.innerHTML = renderedHtml;
        this.parent.appendChild(newDiv);

        this.startTimers();
    }

    setMatches(matches) {
        this.matchesData = Object.values(matches);
        this.render();
    }

    startTimers() {
        // Clear existing timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];

        this.matchesData.forEach((match, index) => {
            const timer = setInterval(() => {
                this.updateMatchTimer(match.id);
            }, 1000);
            this.timers.push(timer);
        });
    }

    updateMatchTimer(matchId) {
        const match = this.matchesData.find(m => m.id === matchId);
        if (!match) return;

        const now = Date.now();
        const expiresAt = new Date(match.expiresAt).getTime();
        const timeLeft = expiresAt - now;

        const cardElement = document.querySelector(`[data-match-id="${matchId}"]`);
        if (!cardElement) return;

        if (timeLeft <= 0) {
            // Match expired - blur it
            cardElement.classList.add('expired');
            
        } else {
            // Update timer
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            const timerElement = cardElement.querySelector('.match-timer');
            if (timerElement) {
                timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
        }
    }

    cleanup() {
        // Clean up timers when leaving the page
        this.timers.forEach(timer => clearInterval(timer));
        this.timers = [];
    }
}

export const matches = new MatchesPage(document.createElement('div'));
