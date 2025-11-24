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
        console.log('[ChatSocket] connect() called');
        if (typeof window === 'undefined') return;
        if (this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)) {
            console.log('[ChatSocket] Already connected or connecting');
            return;
        }

        const token = this.getSessionToken();
        console.log('[ChatSocket] Got session token:', token ? 'YES' : 'NO');
        if (!token) {
            console.warn('[ChatSocket] No session token, disconnected');
            this.updateStatus('disconnected');
            return;
        }

        const url = this.buildWebSocketURL(token);
        console.log('[ChatSocket] Built WebSocket URL:', url);
        if (!url) {
            console.warn('[ChatSocket] Failed to build URL');
            this.updateStatus('disconnected');
            return;
        }

        try {
            console.log('[ChatSocket] Updating status to connecting');
            this.updateStatus('connecting');
            console.log('[ChatSocket] Creating new WebSocket connection to:', url);
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
        console.log('[ChatSocket] Registering WebSocket listeners');

        this.socket.addEventListener('open', () => {
            console.log('[ChatSocket] ✅ WebSocket OPENED successfully!');
            this.reconnectAttempts = 0;
            this.updateStatus('connected');
            this.flushQueue();
        });

        this.socket.addEventListener('message', (event) => {
            console.log('[ChatSocket] Message received:', event.data);
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

        this.socket.addEventListener('close', (event) => {
            console.log('[ChatSocket] ❌ WebSocket CLOSED - code:', event.code, 'reason:', event.reason);
            this.updateStatus('disconnected');
            this.scheduleReconnect();
        });

        this.socket.addEventListener('error', (event) => {
            console.error('[ChatSocket] ❌ WebSocket ERROR:', event);
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
        console.log('[ChatSocket] Status update:', this.status, '->', status);
        if (this.status === status) return;
        this.status = status;
        dispatcher.process({
            type: Actions.CHAT_SOCKET_STATUS,
            payload: { status },
        });
    }

    private getSessionToken(): string | null {
        if (typeof document === 'undefined') return null;
        console.log('[ChatSocket] Getting session token from cookies:', document.cookie);

        // Try localStorage first (if token is stored there)
        const storedToken = localStorage.getItem('session_token');
        if (storedToken) {
            console.log('[ChatSocket] Found session_token in localStorage');
            return storedToken;
        }

        // Try cookies
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'session_token') {
                console.log('[ChatSocket] Found session_token cookie');
                return value;
            }
        }
        console.warn('[ChatSocket] No session_token found in localStorage or cookies');
        return null;
    }

    private buildWebSocketURL(token: string): string | null {
        if (typeof window === 'undefined') return null;

        // Use window.location to determine the correct WebSocket protocol and host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // includes port if present

        console.log('[ChatSocket] Building URL - protocol:', protocol, 'host:', host);
        // Backend requires session_token query parameter (see backend line 63)
        const url = `${protocol}//${host}/ws/chat?session_token=${token}`;
        console.log('[ChatSocket] Final WebSocket URL:', url);
        return url;
    }
}

const chatSocketService = new ChatSocketService();
export default chatSocketService;
