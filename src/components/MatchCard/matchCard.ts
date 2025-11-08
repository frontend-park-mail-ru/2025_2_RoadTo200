/* global Handlebars */

const TEMPLATE_PATH = '/src/components/MatchCard/matchCard.hbs';

export interface MatchData {
    id: string;
    name: string;
    age: number | null;
    image: string;
    timer?: string;
    isNew?: boolean;
    isExpired?: boolean;
}

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Failed to load template');
        }
        return response.text();
    } catch (error) {
        // console.error('Error loading match card template:', error);
        return '<div class="match-card-error">Error loading card</div>';
    }
};


class MatchCardComponent {
    async render(matchData: MatchData = {} as MatchData): Promise<string> {
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
