import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";

class MatchCardStore {
    selectedMatchId = null;

    constructor() {
        dispatcher.register(this);
    }

    handleAction(action) {
        switch (action.type) {
            case Actions.MATCH_CARD_CLICK:
                this.onMatchCardClick(action.payload);
                break;
            case Actions.RENDER_MATCHES:
                this.selectedMatchId = null;
                break;
            case Actions.RENDER_MATCH_PROFILE:
                break;
            default:
                break;
        }
    }

    onMatchCardClick(payload = {}) {
        const { matchId, isExpired } = payload;

        if (!matchId || isExpired) {
            return;
        }

        this.selectedMatchId = matchId;

        dispatcher.process({
            type: Actions.NAVIGATE_TO,
            payload: { path: `/matches/${matchId}` }
        });
    }

    
}

export default new MatchCardStore();
