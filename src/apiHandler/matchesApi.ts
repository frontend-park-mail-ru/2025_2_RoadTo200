import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api`;

export interface Match {
    id: string | number;
    userId: string;
    name: string;
    age: number;
    bio?: string;
    photos: string[];
    interests?: string[];
    matchedAt?: string;
    workout?: boolean;
    fun?: boolean;
    party?: boolean;
    chill?: boolean;
    love?: boolean;
    relax?: boolean;
    yoga?: boolean;
    friendship?: boolean;
    culture?: boolean;
    cinema?: boolean;
}

export interface MatchesResponse {
    matches: Match[];
}

export interface MatchResponse {
    match: Match;
}

class MatchesApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * GET /api/matches - Получить все матчи
     * @returns Promise со всеми матчами
     */
    async getAllMatches(): Promise<MatchesResponse> {
        return handleFetch<MatchesResponse>(this.baseURL, '/matches', {
            method: 'GET',
        });
    }

    /**
     * GET /api/matches/:matchId - Получить конкретный матч
     * @param matchId ID матча
     * @returns Promise с данными матча
     */
    async getMatch(matchId: string | number): Promise<MatchResponse> {
        return handleFetch<MatchResponse>(this.baseURL, `/matches/${matchId}`, {
            method: 'GET',
        });
    }
}

export default new MatchesApi(API_URL);
