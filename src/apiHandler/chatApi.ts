import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL || ''}/api`;

export interface ConversationDTO {
    match_id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_photo: string;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
}

export interface ConversationsResponse {
    conversations: ConversationDTO[];
}

export interface MessageDTO {
    id: string;
    match_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface MessagesResponse {
    messages: MessageDTO[];
    limit: number;
    offset: number;
}

export interface SendMessageResponse {
    message_id: string;
    created_at: string;
}

class ChatApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    async getConversations(searchQuery?: string): Promise<ConversationsResponse> {
        const query = new URLSearchParams();
        if (searchQuery) {
            query.set('search', searchQuery);
        }

        const endpoint = `/chats${query.toString() ? `?${query.toString()}` : ''}`;
        return handleFetch<ConversationsResponse>(this.baseURL, endpoint, {
            method: 'GET',
        });
    }

    async getMessages(
        matchId: string,
        params: { limit?: number; offset?: number } = {}
    ): Promise<MessagesResponse> {
        const query = new URLSearchParams();
        if (params.limit) query.set('limit', params.limit.toString());
        if (params.offset) query.set('offset', params.offset.toString());

        const endpoint = `/chats/${matchId}${
            query.toString() ? `?${query.toString()}` : ''
        }`;
        return handleFetch<MessagesResponse>(this.baseURL, endpoint, {
            method: 'GET',
        });
    }

    async sendMessage(matchId: string, content: string): Promise<SendMessageResponse> {
        return handleFetch<SendMessageResponse>(
            this.baseURL,
            `/chats/${matchId}/messages`,
            {
                method: 'POST',
                body: JSON.stringify({ content }),
            }
        );
    }

    async markAsRead(matchId: string): Promise<void> {
        await handleFetch(this.baseURL, `/chats/${matchId}/read`, {
            method: 'POST',
        });
    }

    async getUnreadCount(): Promise<{ unread_count: number }> {
        return handleFetch<{ unread_count: number }>(
            this.baseURL,
            '/chats/unread',
            {
                method: 'GET',
            }
        );
    }
}

export default new ChatApi(API_URL);
