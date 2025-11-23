import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api/strike`;

export type StrikeType =
    | 'spam'
    | 'fake_profile'
    | 'offensive_content'
    | 'harassment'
    | 'inappropriate_content'
    | 'underage'
    | 'copyright_violation'
    | 'other';

export interface StrikeCreateRequest {
    target_user_id: string;
    type: StrikeType;
    reason?: string;
    reporter_id?: string;
}

export interface StrikeResponse {
    id: string;
    target_user_id: string;
    reporter_id?: string;
    type: StrikeType;
    reason?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

class StrikesApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    createStrike(payload: StrikeCreateRequest): Promise<StrikeResponse> {
        return handleFetch<StrikeResponse>(this.baseURL, '', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
}

export default new StrikesApi();
