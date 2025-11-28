import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { Store } from '../../Dispatcher';

interface MatchCardClickPayload {
    matchId: string;
    isExpired?: boolean;
}

interface Action {
    type: string;
    payload?: any;
}

class MatchCardStore implements Store {
    selectedMatchId: string | null = null;

    constructor() {
        dispatcher.register(this);
    }

    handleAction(action: Action): void | Promise<void> {
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

    onMatchCardClick(
        payload: MatchCardClickPayload = {} as MatchCardClickPayload
    ): void {
        const { matchId, isExpired } = payload;

        if (!matchId || isExpired) {
            return;
        }

        this.selectedMatchId = matchId;

        dispatcher.process({
            type: Actions.NAVIGATE_TO,
            payload: { path: `/matches/${matchId}` },
        });
    }
}

export default new MatchCardStore();
