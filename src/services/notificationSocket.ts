import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
import type { NotificationSocketEvent, NotificationSocketStatus } from '@/types/notification';

class NotificationSocketService {
    private socket: WebSocket | null = null;
    private reconnectTimer: number | null = null;
    private reconnectAttempts = 0;
    private status: NotificationSocketStatus = 'disconnected';

    connect(): void {
        if (typeof window === 'undefined') return;
        if (this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const url = this.buildWebSocketURL();
        if (!url) {
            this.updateStatus('disconnected');
            return;
        }

        try {
            this.updateStatus('connecting');
            this.socket = new WebSocket(url);
            this.registerListeners();
        } catch (error) {
            this.scheduleReconnect();
        }
    }

    disconnect(): void {
        this.clearReconnect();
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.updateStatus('disconnected');
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    getStatus(): NotificationSocketStatus {
        return this.status;
    }

    private registerListeners(): void {
        if (!this.socket) return;

        this.socket.addEventListener('open', () => {
            this.reconnectAttempts = 0;
            this.updateStatus('connected');
        });

        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data) as NotificationSocketEvent;
                dispatcher.process({
                    type: Actions.NOTIFICATION_SOCKET_MESSAGE,
                    payload: data,
                });
            } catch (error) {
                // Silent error handling
            }
        });

        this.socket.addEventListener('close', () => {
            this.updateStatus('disconnected');
            this.scheduleReconnect();
        });

        this.socket.addEventListener('error', () => {
            this.updateStatus('disconnected');
            this.socket?.close();
        });
    }

    private scheduleReconnect(): void {
        if (typeof window === 'undefined') return;
        if (this.reconnectTimer) return;

        this.reconnectAttempts += 1;
        const delay = Math.min(15000, 1000 * 2 ** this.reconnectAttempts);
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    private clearReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    private updateStatus(status: NotificationSocketStatus): void {
        if (this.status === status) return;
        this.status = status;
        dispatcher.process({
            type: Actions.NOTIFICATION_SOCKET_STATUS,
            payload: { status },
        });
    }

    private buildWebSocketURL(): string | null {
        if (typeof window === 'undefined') return null;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws/notifications`;
    }
}

const notificationSocketService = new NotificationSocketService();
export default notificationSocketService;
