import handleFetch from './handler.js';
import serverURL from './serverURL.JS';

const API_URL = `${serverURL}/api`;

class MatchesApi {
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * GET /api/matches - Get all matches
     * @returns {Promise<Object>} Object with all matches
     */
    async getAllMatches() {
        return handleFetch(this.baseURL, '/matches', { method: 'GET' });
    }

    /**
     * GET /api/matches/:matchId - Get a specific match
     * @param {string|number} matchId - ID of the match
     * @returns {Promise<Object>} Match data
     */
    async getMatch(matchId) {
        return handleFetch(this.baseURL, `/matches/${matchId}`, { method: 'GET' });
    }
}

export default new MatchesApi(API_URL);
