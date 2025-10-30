import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { matches } from "./matches.js";

import MatchesApi from "../../apiHandler/matchesApi.js";

class MatchesStore {
    matches;
    
    constructor() {
        this.matches = [];
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_MATCHES:
                await this.renderMatches();
                break;

            default:
                break;
        }
    }

    async renderMatches() {
        try {
            // Set the parent to contentContainer
            const contentContainer = document.getElementById('content-container');
            if (contentContainer) {
                matches.parent = contentContainer;
            }
            
            // First render the page
            await matches.render();
            
            // Then fetch and display matches
            const matchesData = await MatchesApi.getAllMatches();
            this.matches = matchesData;
            matches.setMatches(matchesData);
            
        } catch (error) {
            console.error('Error loading matches:', error);
            await matches.render();
            // Could dispatch an error action here if needed
        }
    }
}

export default new MatchesStore();
