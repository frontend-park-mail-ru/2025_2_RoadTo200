import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
import serverURL from '@/apiHandler/serverURL';
import type { ChatSocketEvent, ChatSocketStatus } from '@/types/chat';

class ChatSocketService {
    private socket: WebSocket | null = null;
    private reconnectTimer: number | null = null;
    private reconnectAttempts = 0;
    private queuedMessages: string[] = [];
    private status: ChatSocketStatus = 'disconnected';

    connect(): void {
        if (typeof window === 'undefined') return;
        if (this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const token = this.getSessionToken();
        if (!token) {
            this.updateStatus('disconnected');
            return;
        }

        const url = this.buildWebSocketURL(token);
        if (!url) {
            this.updateStatus('disconnected');
            return;
        }

        try {
            this.updateStatus('connecting');
            this.socket = new WebSocket(url);
            this.registerListeners();
        } catch (error) {
            console.error('ChatSocket: failed to connect', error);
            this.scheduleReconnect();
        }
    }

    disconnect(): void {
        this.clearReconnect();
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.queuedMessages = [];
        this.updateStatus('disconnected');
    }

    isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    getStatus(): ChatSocketStatus {
        return this.status;
    }

    sendMessage(matchId: string, content: string): void {
        const payload = JSON.stringify({ match_id: matchId, content });
        this.send(payload);
    }

    private send(payload: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(payload);
            return;
        }

        this.queuedMessages.push(payload);
        this.connect();
    }

    private flushQueue(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        while (this.queuedMessages.length > 0) {
            const message = this.queuedMessages.shift();
            if (message) {
                this.socket.send(message);
            }
        }
    }

    private registerListeners(): void {
        if (!this.socket) return;

        this.socket.addEventListener('open', () => {
            this.reconnectAttempts = 0;
            this.updateStatus('connected');
            this.flushQueue();
        });

        this.socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data) as ChatSocketEvent;
                dispatcher.process({
                    type: Actions.CHAT_SOCKET_MESSAGE,
                    payload: data,
                });
            } catch (error) {
                console.error('ChatSocket: failed to parse message', error);
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

    private updateStatus(status: ChatSocketStatus): void {
        if (this.status === status) return;
        this.status = status;
        dispatcher.process({
            type: Actions.CHAT_SOCKET_STATUS,
            payload: { status },
        });
    }

    private getSessionToken(): string | null {
        if (typeof document === 'undefined') return null;
        const match = document.cookie
            ?.split(';')
            .map((part) => part.trim())
            .find((cookie) => cookie.startsWith('session_token='));

        if (!match) return null;
        return decodeURIComponent(match.split('=')[1] || '');
    }

    private buildWebSocketURL(token: string): string | null {
        if (typeof window === 'undefined') return null;

        const base = serverURL && serverURL.trim().length > 0
            ? serverURL
            : window.location.origin;

        try {
            const url = new URL('/ws/chat', base);
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            url.searchParams.set('session_token', token);
            return url.toString();
        } catch (error) {
            console.error('ChatSocket: failed to build url', error);
            return null;
        }
    }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;
