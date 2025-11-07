import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { matchProfile } from "./matchProfile.js";

class MatchProfileStore {
    matchData = {};

    currentMatchId = null;
    
    // Кэш данных матчей для быстрого доступа
    matchesCache = new Map();

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MATCH_PROFILE:
                await this.renderMatchProfile(action.payload);
                break;
            case Actions.MATCH_CARD_CLICK:
                await this.handleMatchCardClick(action.payload);
                break;
            default:
                break;
        }
    }

    async handleMatchCardClick(payload) {
        const { matchId, userData } = payload;
        if (!matchId) return;
        
        // Сохраняем данные в кэш
        if (userData) {
            this.matchesCache.set(matchId, userData);
        }
        
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

            // Пытаемся получить данные из кэша
            let userData = this.matchesCache.get(matchId);
            
            if (!userData) {
                console.warn('Match data not found in cache for:', matchId);
                // Показываем заглушку или редиректим назад
                this.matchData = {
                    id: matchId,
                    name: "Пользователь",
                    age: "",
                    description: "Информация недоступна",
                    musician: "",
                    quote: "",
                    interests: [],
                    photoCards: []
                };
            } else {
                // Преобразуем данные пользователя в формат профиля
                this.matchData = {
                    id: userData.id,
                    name: userData.name || "",
                    age: userData.birth_date ? this.calculateAge(userData.birth_date) : "",
                    description: userData.bio || userData.description || "Информация отсутствует",
                    musician: userData.musician || "",
                    quote: userData.quote || "",
                    interests: userData.interests || [],
                    photoCards: this.transformImagesToCards(userData.images || [])
                };
            }

            await matchProfile.render(this.matchData);
        } catch (error) {
            console.error('Error loading match profile:', error);
        }
    }
    
    calculateAge(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    transformImagesToCards(images) {
        const photoCards = images.map((imageUrl, index) => ({
            id: `photo-${index}`,
            image: imageUrl,
            isUserPhoto: true,
            isPrimary: index === 0
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

