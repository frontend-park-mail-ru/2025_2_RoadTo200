export type ChatSocketStatus = 'connected' | 'connecting' | 'disconnected';

export interface ChatSocketEvent {
    type: 'message' | 'read' | 'typing' | 'error' | string;
    match_id: string;
    sender_id?: string;
    message_id?: string;
    content?: string;
    created_at?: string;
    error?: string;
}

export interface SelectChatPayload {
    chatId: string;
    userName: string;
    userPhoto?: string;
}
