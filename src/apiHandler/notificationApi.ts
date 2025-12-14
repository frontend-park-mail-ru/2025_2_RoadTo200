import handleFetch from './handler';
import serverURL from './serverURL';
import type { NotificationsResponse } from '@/types/notification';

const API_URL = `${serverURL || ''}/api`;

class NotificationApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    async getNotifications(): Promise<NotificationsResponse> {
        return handleFetch<NotificationsResponse>(this.baseURL, '/notifications', {
            method: 'GET',
        });
    }

    async markAsRead(notificationId: string): Promise<void> {
        await handleFetch(this.baseURL, `/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }
}

const notificationApi = new NotificationApi();
export default notificationApi;
