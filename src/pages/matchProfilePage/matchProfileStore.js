import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { matchProfile } from "./matchProfile.js";
import router from "../../../app.js";

class MatchProfileStore {
    matchData = {};

    currentMatchId = null;
    
    // Кэш данных мэтчей для быстрого доступа
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
        
        // Используем роутер для навигации
        router.navigateTo(`/matches/${matchId}`);
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

            // Получаем данные из кэша
            const userData = this.matchesCache.get(matchId);
            
            if (!userData) {
                console.error('No user data found in cache for matchId:', matchId);
                // Можно показать ошибку или редирект на /matches
                return;
            }

            // Преобразуем данные в нужный формат
            this.matchData = {
                id: userData.id,
                name: userData.name || "",
                age: this.calculateAge(userData.birth_date),
                description: userData.bio || "Информация отсутствует",
                musician: "Не указано", // TODO: добавить в профиль если нужно
                quote: "Не указано", // TODO: добавить в профиль если нужно
                interests: [], // TODO: добавить интересы если нужно
                photoCards: this.transformImagesToCards(userData.images || [])
            };

            await matchProfile.render(this.matchData);
        } catch (error) {
            console.error('Error loading match profile:', error);
        }
    }
    
    calculateAge(birthDate) {
        if (!birthDate) return null;
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
