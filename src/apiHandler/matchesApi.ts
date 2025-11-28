import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api`;

export interface MatchDTO {
    match: {
        id: string;
        is_active: boolean;
        matched_at: string;
        user1_id: string;
        user2_id: string;
    };
    user: {
        id: string;
        name: string;
        email?: string;
        bio?: string;
        quote?: string;
        birth_date?: string;
        [key: string]: unknown;
    };
    photos: string[];
    age: number;
    description: string;
    photos_count: number;
}

export interface MatchesResponse {
    matches: MatchDTO[];
    total: number;
    limit: number;
    offset: number;
}

export interface UnmatchRequest {
    target_user_id: string;
}

class MatchesApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * GET /api/match - Получить все матчи
     */
    async getAllMatches(
        params: { limit?: number; offset?: number } = {}
    ): Promise<MatchesResponse> {
        const query = new URLSearchParams();
        if (params.limit) query.set('limit', params.limit.toString());
        if (params.offset) query.set('offset', params.offset.toString());

        const endpoint = `/match${query.toString() ? `?${query.toString()}` : ''}`;
        return handleFetch<MatchesResponse>(this.baseURL, endpoint, {
            method: 'GET',
        });
    }

    /**
     * DELETE /api/match/unmatch - удалить мэтч
     */
    async unmatch(targetUserId: string): Promise<void> {
        await handleFetch(this.baseURL, '/match/unmatch', {
            method: 'DELETE',
            body: JSON.stringify({ target_user_id: targetUserId } satisfies UnmatchRequest),
        });
    }
}

export default new MatchesApi(API_URL);
