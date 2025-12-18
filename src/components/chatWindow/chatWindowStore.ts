import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { chatWindow } from './chatWindow';
import type { Store } from '../../Dispatcher';
import ChatApi, { type MessageDTO } from '@/apiHandler/chatApi';
import AuthApi from '@/apiHandler/authApi';
import chatSocket from '@/services/chatSocket';
import type {
    ChatSocketEvent,
    ChatSocketStatus,
    SelectChatPayload,
} from '@/types/chat';

interface MessageView {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    createdAt: string;
    isMine: boolean;
}

interface ChatMeta {
    userName: string;
    userPhoto?: string;
    initials: string;
    userId?: string;
}

class ChatWindowStore implements Store {
    private currentChatId: string | null = null;
    private readonly messagesByChat = new Map<string, MessageView[]>();
    private readonly chatMeta = new Map<string, ChatMeta>();
    private readonly chatWindowComponent = chatWindow;
    private readonly drafts = new Map<string, string>();
    private currentUserId: string | null = null;
    private isLoading = false;
    private isSending = false;
    private socketStatus: ChatSocketStatus = 'disconnected';
    private markAsReadTimer: number | null = null;
    private readonly loadedChats = new Set<string>(); // Track which chats have been loaded
    private hasAnyChats = false; // Track if user has any chats at all
    private isLoadingChats = true; // Track if chats list is loading - начинаем с true

    constructor() {
        dispatcher.register(this);
        void this.ensureUser();
        chatSocket.connect();
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_CHAT_WINDOW:
                // Если нет payload, это закрытие чата
                if (!action.payload) {
                    this.currentChatId = null;
                }
                await this.renderChatWindow();
                break;

            case Actions.SELECT_CHAT:
                await this.handleChatSelection(action.payload as SelectChatPayload);
                break;

            case Actions.CHATS_LIST_UPDATED:
                this.hasAnyChats = (action.payload as { hasChats?: boolean })?.hasChats || false;
                this.isLoadingChats = (action.payload as { isLoading?: boolean })?.isLoading || false;
                await this.renderChatWindow();
                break;

            case Actions.SEND_MESSAGE:
                await this.handleSendMessage((action.payload as { text?: string })?.text);
                break;

            case Actions.LOAD_CHAT_MESSAGES:
                await this.loadMessages((action.payload as { chatId: string })?.chatId);
                break;

            case Actions.CHAT_SOCKET_MESSAGE:
                this.handleSocketEvent(action.payload as ChatSocketEvent);
                break;

            case Actions.CHAT_SOCKET_STATUS:
                this.socketStatus = (action.payload as { status: ChatSocketStatus })?.status;
                await this.renderChatWindow();
                break;

            case Actions.AUTH_STATE_UPDATED:
                await this.handleAuthUpdate(action.payload as { user?: { id?: string } | null });
                break;

            case Actions.CHAT_UPDATE_DRAFT:
                this.updateDraft(
                    (action.payload as { chatId?: string })?.chatId ||
                        this.currentChatId ||
                        '',
                    (action.payload as { text?: string })?.text || ''
                );
                break;

            case Actions.NAVIGATE_TO:
                const path = (action.payload as { path?: string })?.path || '';
                if (!path.startsWith('/chats')) {
                    this.currentChatId = null;
                }
                break;

            default:
                break;
        }
    }

    private async ensureUser(): Promise<void> {
        try {
            const response = await AuthApi.checkAuth();
            this.currentUserId = response.user?.id || null;
        } catch {
            this.currentUserId = null;
        }
    }

    private async handleAuthUpdate(payload: { user?: { id?: string } | null }): Promise<void> {
        this.currentUserId = payload?.user?.id || null;
        if (!this.currentUserId) {
            this.currentChatId = null;
            this.messagesByChat.clear();
            this.chatMeta.clear();
            this.loadedChats.clear();
            chatSocket.disconnect();
            await this.renderChatWindow();
        } else {
            chatSocket.connect();
        }
    }

    private async handleChatSelection(payload?: SelectChatPayload): Promise<void> {
        if (!payload?.chatId) {
            return;
        }
        
        this.currentChatId = payload.chatId;
        this.chatMeta.set(payload.chatId, {
            userName: payload.userName,
            userPhoto: payload.userPhoto,
            initials: this.getInitials(payload.userName),
            userId: payload.userId,
        });

        // Ensure page is rendered before adding class
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Add class for mobile devices with retry logic
        if (typeof document !== 'undefined') {
            const addMobileClass = () => {
                const chatsPage = document.querySelector('.chats-page');
                if (chatsPage) {
                    chatsPage.classList.add('chats-page--conversation-open');
                    return true;
                }
                return false;
            };
            
            // Try immediately
            if (!addMobileClass()) {
                // If failed, retry after delay
                await new Promise(resolve => setTimeout(resolve, 100));
                addMobileClass();
            }
        }

        // Ensure chat window has parent before loading messages
        if (!this.chatWindowComponent.parent) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await this.loadMessages(payload.chatId);
    }

    private async loadMessages(chatId?: string): Promise<void> {
        if (!chatId) return;

        // Убедимся что currentUserId загружен перед мапингом сообщений
        await this.ensureUser();

        this.isLoading = true;
        await this.renderChatWindow();

        const isInitialLoad = !this.loadedChats.has(chatId);
        
        try {
            const { messages } = await ChatApi.getMessages(chatId, { limit: 100 });
            const mapped = messages.map((message) => this.mapMessage(message));
            this.messagesByChat.set(chatId, mapped);
            this.sortMessages(chatId);
            this.scheduleMarkAsRead(chatId);
            this.loadedChats.add(chatId); // Mark as loaded
        } catch (error) {
            // Failed to load messages
        } finally {
            this.isLoading = false;
            await this.renderChatWindow(false, isInitialLoad);
        }
    }

    private mapMessage(message: MessageDTO): MessageView {
        const created = new Date(message.created_at);
        const timestamp = created.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const isMine = message.sender_id === this.currentUserId;

        return {
            id: message.id,
            text: message.content,
            senderId: message.sender_id,
            timestamp,
            createdAt: message.created_at,
            isMine,
        };
    }

    private getMessages(chatId: string | null): MessageView[] {
        if (!chatId) return [];
        return this.messagesByChat.get(chatId) || [];
    }

    private async handleSendMessage(text?: string): Promise<void> {
        if (!text || !this.currentChatId) return;
        const trimmed = text.trim();
        if (!trimmed) return;

        const chatId = this.currentChatId;
        this.isSending = true;
        
        try {
            if (chatSocket.isConnected()) {
                chatSocket.sendMessage(chatId, trimmed);
                // Clear draft immediately for WebSocket
                this.drafts.set(chatId, '');
                await this.renderChatWindow(false);
            } else {
                const response = await ChatApi.sendMessage(chatId, trimmed);
                this.appendMessage(chatId, {
                    id: response.message_id,
                    text: trimmed,
                    senderId: this.currentUserId || '',
                    timestamp: new Date(response.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    createdAt: response.created_at,
                    isMine: true,
                });
                this.drafts.set(chatId, '');
            }
        } catch (error) {
            // Message send failed
            await this.renderChatWindow();
        } finally {
            this.isSending = false;
        }
    }

    private appendMessage(chatId: string, message: MessageView): void {
        const list = this.messagesByChat.get(chatId) || [];
        
        // Check if message already exists to avoid duplicates
        const exists = list.some(m => m.id === message.id);
        if (exists) return;
        
        list.push(message);
        this.messagesByChat.set(chatId, list);
        this.sortMessages(chatId);
        if (chatId === this.currentChatId) {
            // Just update UI without scrolling
            void this.renderChatWindow(true);
        }
    }

    private sortMessages(chatId: string): void {
        const messages = this.messagesByChat.get(chatId);
        if (!messages) return;

        messages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB;
        });
    }

    private handleSocketEvent(event: ChatSocketEvent): void {
        if (!event || !event.match_id) return;

        if (event.type === 'message') {
            const mapped: MessageView = {
                id: event.message_id || `msg-${Date.now()}`,
                text: event.content || '',
                senderId: event.sender_id || '',
                timestamp: event.created_at
                    ? new Date(event.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : '',
                createdAt: event.created_at || new Date().toISOString(),
                isMine: event.sender_id === this.currentUserId,
            };

            // Just append without scrolling
            this.appendMessage(event.match_id, mapped);

            if (
                event.match_id === this.currentChatId &&
                event.sender_id &&
                event.sender_id !== this.currentUserId
            ) {
                this.scheduleMarkAsRead(event.match_id);
            }
        }
    }

    private scheduleMarkAsRead(chatId: string): void {
        if (typeof window === 'undefined') return;
        if (this.markAsReadTimer) {
            clearTimeout(this.markAsReadTimer);
        }

        this.markAsReadTimer = window.setTimeout(() => {
            void this.markAsRead(chatId);
        }, 400);
    }

    private updateDraft(chatId: string, text: string): void {
        if (!chatId) return;
        this.drafts.set(chatId, text);
    }

    private async markAsRead(chatId: string): Promise<void> {
        if (!chatId) return;
        try {
            await ChatApi.markAsRead(chatId);
            dispatcher.process({
                type: Actions.CHAT_MARKED_AS_READ,
                payload: { chatId },
            });
        } catch (error) {
            // Mark as read failed
        }
    }

    private async renderChatWindow(preserveInput = false, isInitialLoad = false): Promise<void> {
        // Store current input value if preserving
        let currentInputValue = '';
        let currentInputElement: HTMLTextAreaElement | null = null;
        
        if (preserveInput && typeof document !== 'undefined') {
            currentInputElement = document.querySelector('.chat-window__input');
            if (currentInputElement) {
                currentInputValue = currentInputElement.value;
            }
        }
        
        const messages = this.getMessages(this.currentChatId);
        const meta = this.currentChatId
            ? this.chatMeta.get(this.currentChatId)
            : null;
        const draft = this.currentChatId
            ? this.drafts.get(this.currentChatId) || ''
            : '';

        const placeholder = !this.currentChatId
            ? this.isLoadingChats
                ? {
                    title: 'Загрузка чатов',
                    subtitle: 'Пожалуйста, подождите...',
                }
                : this.hasAnyChats
                    ? {
                        title: 'Чат не выбран',
                        subtitle: 'Выберите чат из списка слева, чтобы начать общение',
                    }
                    : {
                        title: 'У Вас пока нет чатов',
                        subtitle: 'Возможно, Вам стоит еще поискать подходящих людей',
                        action: 'home' as const,
                    }
            : undefined;

        await this.chatWindowComponent.render({
            messages,
            chatId: this.currentChatId,
            otherUserName: meta?.userName,
            otherUserPhoto: meta?.userPhoto,
            otherUserInitials: meta?.initials,
            otherUserId: meta?.userId,
            isLoading: this.isLoading,
            isInputDisabled: !this.currentChatId || this.isLoading || this.isSending,
            placeholder,
            socketStatus: this.formatSocketStatus(),
            draft,
            draftLength: draft.length,
            isInitialLoad,
        });
        
        // Ensure mobile class is present after render if chat is selected
        if (this.currentChatId && typeof document !== 'undefined') {
            const chatsPage = document.querySelector('.chats-page');
            if (chatsPage && !chatsPage.classList.contains('chats-page--conversation-open')) {
                chatsPage.classList.add('chats-page--conversation-open');
            }
        }
        
        // Restore input value if it was preserved
        if (preserveInput && currentInputValue && typeof document !== 'undefined') {
            const newInputElement = document.querySelector('.chat-window__input') as HTMLTextAreaElement;
            if (newInputElement) {
                newInputElement.value = currentInputValue;
                // Update counter
                const counter = document.querySelector('.chat-window__counter');
                if (counter) {
                    counter.textContent = `${currentInputValue.length} / 250`;
                }
                // Восстанавливаем фокус только если не работаем с полем поиска
                const activeElement = document.activeElement;
                const isSearchActive = activeElement?.classList.contains('chats-list__search-input');
                if (!isSearchActive) {
                    setTimeout(() => {
                        newInputElement.focus();
                        newInputElement.setSelectionRange(currentInputValue.length, currentInputValue.length);
                    }, 0);
                }
            }
        }
    }

    private formatSocketStatus(): string {
        switch (this.socketStatus) {
            case 'connected':
                return 'Онлайн';
            case 'connecting':
                return 'Подключаемся…';
            case 'disconnected':
            default:
                return 'Соединение отсутствует';
        }
    }

    private getInitials(name?: string): string {
        if (!name) return 'T';
        const parts = name.trim().split(/\s+/);
        return parts
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('') || 'T';
    }
}

export default new ChatWindowStore();
