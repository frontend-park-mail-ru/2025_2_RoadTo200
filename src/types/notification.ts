export type NotificationSocketStatus = 'connected' | 'connecting' | 'disconnected';

export interface NotificationDTO {
    id: string;
    user_id: string;
    from_user_id: string;
    match_id: string;
    type: 'like' | 'super_like' | 'message' | 'match';
    created_at: string;
    is_read: boolean;
}

export interface NotificationsResponse {
    notifications: NotificationDTO[];
    limit: number;
    offset: number;
    total: number;
}

export interface NotificationSocketEvent {
    type: 'notification' | 'read' | 'error' | string;
    id?: string;
    notif_type?: 'like' | 'super_like' | 'message' | 'match';
    from_user_id?: string;
    created_at?: string;
    is_read?: boolean;
    notification?: NotificationDTO;
    notification_id?: string;
    error?: string;
}
