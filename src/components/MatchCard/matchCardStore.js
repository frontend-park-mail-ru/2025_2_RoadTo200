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
                this.onMatchProfileRender(action.payload);
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

        const path = `/matches/${matchId}`;
        window.history.pushState({ route: "matches", matchId }, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    //функция заглушка для обработки рендера профиля мэтча
    onMatchProfileRender(payload = {}) {
        const { matchId } = payload;

        
        if (matchId) {
            this.selectedMatchId = matchId;
        }
    }
}

export default new MatchCardStore();
