/* global Handlebars */

const TEMPLATE_PATH = '/src/components/MatchCard/matchCard.hbs';

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Failed to load template');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading match card template:', error);
        return '<div class="match-card-error">Error loading card</div>';
    }
};


class MatchCardComponent {
    async render(matchData = {}) {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const data = {
            id: matchData.id,
            name: matchData.name,
            age: matchData.age,
            image: matchData.image,
            timer: matchData.timer || '00:00',
            isNew: matchData.isNew || false,
            isExpired: matchData.isExpired || false,
        };

        return template(data);
    }
}

export default new MatchCardComponent();
