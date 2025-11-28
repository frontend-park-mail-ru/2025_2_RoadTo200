import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';
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
                // Message parsing failed
            }
        });

        this.socket.addEventListener('close', (event) => {
            this.updateStatus('disconnected');
            this.scheduleReconnect();
        });

        this.socket.addEventListener('error', (event) => {
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



    private buildWebSocketURL(): string | null {
        if (typeof window === 'undefined') return null;

        // Use window.location to determine the correct WebSocket protocol and host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // includes port if present

        // Backend uses cookie-based authentication, browser sends cookies automatically
        const url = `${protocol}//${host}/ws/chat`;
        return url;
    }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;
