import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { matchProfile } from "./matchProfile.js";
import MatchesApi from "../../apiHandler/matchesApi.js";

class MatchProfileStore {
    matchData = {};

    currentMatchId = null;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MATCH_PROFILE:
                await this.renderMatchProfile(action.payload);
                break;
            case Actions.MATCH_CARD_CLICK:
                await MatchProfileStore.handleMatchCardClick(action.payload);
                break;
            default:
                break;
        }
    }

    static async handleMatchCardClick(payload) {
        const { matchId } = payload;
        if (!matchId) return;
        
        // Navigate to match profile page
        window.history.pushState(null, null, `/matches/${matchId}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }

    async renderMatchProfile(payload) {
        try {
            const { matchId } = payload;
            if (!matchId) {
                console.error('No matchId provided');
                return;
            }

            this.currentMatchId = matchId;

            const contentContainer = document.getElementById('content-container');
            if (contentContainer) {
                matchProfile.parent = contentContainer;
            }

            // Fetch match data from API
            const response = await MatchesApi.getMatch(matchId);

            if (response && response.id) {
                this.matchData = {
                    id: response.id,
                    name: response.name || "",
                    age: response.age || "",
                    description: response.description || "Информация отсутствует",
                    musician: response.musician || "Не указано",
                    quote: response.quote || "Не указано",
                    interests: response.interests || [],
                    photoCards: MatchProfileStore.transformPhotosToCards(response.photos || [])
                };

                await matchProfile.render(this.matchData);
            }
        } catch (error) {
            console.error('Error loading match profile:', error);
        }
    }

    static transformPhotosToCards(photos) {
        const photoCards = photos.map(photo => ({
            id: photo.id,
            image: photo.imageUrl || photo.image,
            isUserPhoto: true,
            isPrimary: photo.isPrimary || false
        }));

        // Fill up to 4 cards
        while (photoCards.length < 4) {
            photoCards.push({
                id: `placeholder-${photoCards.length}`,
                image: '',
                isUserPhoto: false
            });
        }

        return photoCards;
    }
}

export default new MatchProfileStore();
