const TEMPLATE_PATH = './src/components/MatchCard/matchCard.hbs';

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

const calculateTimer = (expiresAt) => {
    const now = Date.now();
    const expiresTime = new Date(expiresAt).getTime();
    const timeLeft = expiresTime - now;

    if (timeLeft <= 0) {
        return '00:00';
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

class MatchCardComponent {
    async render(matchData) {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const timer = calculateTimer(matchData.expiresAt);
        const isExpired = timer === '00:00';

        const data = {
            id: matchData.id,
            name: matchData.name,
            age: matchData.age,
            image: matchData.image,
            timer: timer,
            isNew: matchData.isNew || false,
            isExpired: isExpired
        };

        return template(data);
    }
}

export default new MatchCardComponent();
