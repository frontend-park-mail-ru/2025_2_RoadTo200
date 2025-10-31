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

    constructor(parent) {
        this.parent = parent;
        this.matchesData = [];
    }

    async render() {
        this.parent.innerHTML = '';

        const pageTemplateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(pageTemplateString);

        const matchCardsHtmlPromises = this.matchesData.map(match => MatchCard.render(match));
        const matchCardsHtml = await Promise.all(matchCardsHtmlPromises);

        const renderedHtml = pageTemplate({
            matches: matchCardsHtml,
            noMatches: this.matchesData.length === 0
        });

        this.parent.innerHTML = '';
        const newDiv = document.createElement('div');
        newDiv.id = 'matchesDiv';
        newDiv.innerHTML = renderedHtml;
        this.parent.appendChild(newDiv);
    }

    setMatches(matchesArr) {
        // ожидаем массив с уже вычисленными полями timer/isExpired
        this.matchesData = Array.isArray(matchesArr) ? matchesArr : Object.values(matchesArr || []);
        this.render();
    }
}

export const matches = new MatchesPage(document.createElement('div'));
