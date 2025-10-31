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
                this.renderMatchProfile(action.payload);
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

            
            const matchesData = await MatchesApi.getAllMatches();
            this.matches = Array.isArray(matchesData) ? matchesData : Object.values(matchesData || []);

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

    renderMatchProfile(payload = {}) {    
    }

}

export default new MatchesStore();

