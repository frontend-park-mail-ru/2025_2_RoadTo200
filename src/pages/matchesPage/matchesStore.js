import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { matches } from "./matches.js";

import MatchesApi from "../../apiHandler/matchesApi.js";

const UPDATE_INTERVAL = 60 * 1000;

class MatchesStore {
    timerId;

    matches;
    
    constructor() {
        this.matches = [];
        dispatcher.register(this);
        this.timerId = null;
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MATCHES:
                await this.renderMatches();
                break;

            case Actions.RENDER_MATCH_PROFILE:
                break;

            default:
                break;
        }
    }

    async renderMatches() {
        try {
           
            const contentContainer = document.getElementById('content-container');
            if (contentContainer) {
                matches.parent = contentContainer;
            }

            
            const response = await MatchesApi.getAllMatches();
            
            // Бекенд возвращает { matches: [...], total, limit, offset }
            const matchesArray = response.matches || [];
            
            // Преобразуем структуру данных
            this.matches = matchesArray.map(item => {
                const match = item.match || {};
                const user = item.user || {};
                
                // Используем matched_at для расчета времени истечения (24 часа)
                const matchedAt = match.matched_at ? new Date(match.matched_at) : new Date();
                const expiresAt = new Date(matchedAt.getTime() + 24 * 60 * 60 * 1000);
                
                return {
                    id: user.id || match.id,
                    name: user.name || 'Unknown',
                    age: user.birth_date ? this.calculateAge(user.birth_date) : null,
                    photo: user.photo_url || '/src/assets/image.png',
                    matchId: match.id,
                    matchedAt: matchedAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    isNew: this.isMatchNew(matchedAt),
                    isActive: match.is_active !== false
                };
            });

            this.updateDerivedFields();
            matches.setMatches(this.matches);

            

            if (!this.timerId) {
                this.timerId = setInterval(() => {
                    this.updateDerivedFields();
                    
                    matches.setMatches(this.matches);
                }, UPDATE_INTERVAL);
            }

        } catch (error) {
            console.error('Error loading matches:', error);
            matches.setMatches([]);
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
    
    isMatchNew(matchedAt) {
        const now = new Date();
        const matched = new Date(matchedAt);
        const hoursSinceMatch = (now - matched) / (1000 * 60 * 60);
        return hoursSinceMatch < 1; // Новый если меньше часа назад
    }

    updateDerivedFields() {
        const now = Date.now();

        this.matches = this.matches.map(m => {
            const expiresAt = new Date(m.expiresAt).getTime();
            const timeLeft = expiresAt - now;

            const isExpired = timeLeft <= 0;

            let timer = '00:00';
            if (!isExpired) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                timer = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            return {
                ...m,
                timer,
                isExpired,
                isNew: !!m.isNew
            };
        });
    }


}

export default new MatchesStore();

