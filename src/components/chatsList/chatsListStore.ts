import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { chatsList } from './chatsList';
import type { Store } from '../../Dispatcher';
import ChatApi, { type ConversationDTO } from '@/apiHandler/chatApi';
import AuthApi from '@/apiHandler/authApi';
import type { ChatSocketEvent, SelectChatPayload } from '@/types/chat';

interface ChatListItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    initials: string;
    lastMessage: string;
    timestamp: string;
    lastMessageDate: number;
    unreadCount: number;
}

class ChatsListStore implements Store {
    private chats: ChatListItem[] = [];
    private selectedChatId: string | null = null;
    private readonly chatsListComponent = chatsList;
    private isLoading = false;
    private searchQuery = '';
    private error: string | null = null;
    private isInitialized = false;
    private currentUserId: string | null = null;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_CHATS_LIST:
                await this.ensureUser();
                if (!this.isInitialized) {
                    await this.fetchChats();
                    this.isInitialized = true;
                } else {
                    await this.renderChatsList();
                }
                break;

            case Actions.SELECT_CHAT:
                this.handleSelection(action.payload as SelectChatPayload);
                break;

            case Actions.LOAD_CHATS:
                await this.fetchChats();
                break;

            case Actions.UPDATE_CHAT_SEARCH:
                this.searchQuery = ((action.payload as { query?: string })?.query || '')
                    .trim();
                await this.fetchChats();
                break;

            case Actions.CHAT_SOCKET_MESSAGE:
                this.handleSocketEvent(action.payload as ChatSocketEvent);
                break;

            case Actions.CHAT_MARKED_AS_READ:
                this.clearUnread((action.payload as { chatId: string }).chatId);
                break;

            case Actions.AUTH_STATE_UPDATED:
                await this.handleAuthUpdate(action.payload as { user?: { id?: string } | null });
                break;

            default:
                break;
        }
    }

    private async ensureUser(): Promise<void> {
        if (this.currentUserId) return;
        try {
            const response = await AuthApi.checkAuth();
            this.currentUserId = response.user?.id || null;
        } catch {
            this.currentUserId = null;
        }
    }

    private async handleAuthUpdate(payload: { user?: { id?: string } | null }): Promise<void> {
        const userId = payload?.user?.id || null;
        this.currentUserId = userId;
        if (!userId) {
            this.chats = [];
            this.selectedChatId = null;
            this.error = null;
            await this.renderChatsList();
        }
    }

    private handleSelection(payload?: SelectChatPayload): void {
        if (!payload?.chatId) return;
        this.selectedChatId = payload.chatId;
        void this.renderChatsList();
    }

    private async fetchChats(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        await this.renderChatsList();

        try {
            // Use server-side search via backend API
            const { conversations } = await ChatApi.getConversations(this.searchQuery);
            this.chats = conversations.map((conversation) =>
                this.mapConversation(conversation)
            );

            if (!this.selectedChatId && this.chats.length > 0) {
                const firstChat = this.chats[0];
                this.selectedChatId = firstChat.id;
                dispatcher.process({
                    type: Actions.SELECT_CHAT,
                    payload: {
                        chatId: firstChat.id,
                        userName: firstChat.userName,
                        userPhoto: firstChat.userAvatar,
                    },
                });
            }
        } catch (error) {
            this.error =
                error instanceof Error
                    ? error.message
                    : 'Не удалось загрузить чаты';
        } finally {
            this.isLoading = false;
            await this.renderChatsList();
        }
    }



    private mapConversation(conversation: ConversationDTO): ChatListItem {
        const date = conversation.last_message_time
            ? Date.parse(conversation.last_message_time)
            : 0;

        return {
            id: conversation.match_id,
            userId: conversation.other_user_id,
            userName: conversation.other_user_name || 'Без имени',
            userAvatar: conversation.other_user_photo || undefined,
            initials: this.getInitials(conversation.other_user_name),
            lastMessage: conversation.last_message || 'Пока нет сообщений',
            timestamp: this.formatTimestamp(conversation.last_message_time),
            lastMessageDate: Number.isNaN(date) ? 0 : date,
            unreadCount: conversation.unread_count,
        };
    }

    private sortChats(): void {
        this.chats.sort((a, b) => b.lastMessageDate - a.lastMessageDate);
    }

    private getInitials(name?: string | null): string {
        if (!name) return 'T';
        const parts = name.trim().split(/\s+/);
        const initials = parts
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('');
        return initials || 'T';
    }

    private formatTimestamp(dateString?: string | null): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';

        const now = new Date();
        const sameDay = date.toDateString() === now.toDateString();
        const yesterday =
            new Date(now.getTime() - 86400000).toDateString() ===
            date.toDateString();

        if (sameDay) {
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        if (yesterday) {
            return 'Вчера';
        }

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    private async renderChatsList(): Promise<void> {
        const emptyState =
        {
            title: 'У Вас пока нет чатов',
            subtitle: 'Возможно Вам стоит еще поискать подходящих людей',
        };

        await this.chatsListComponent.render({
            chats: this.chats,
            selectedChatId: this.selectedChatId ?? undefined,
            searchQuery: this.searchQuery,
            isLoading: this.isLoading,
            emptyState,
        });
    }

    private handleSocketEvent(event: ChatSocketEvent): void {
        if (!event?.match_id) return;

        switch (event.type) {
            case 'message':
                this.applyIncomingMessage(event);
                break;
            case 'read':
                this.clearUnread(event.match_id);
                break;
            default:
                break;
        }
    }

    private applyIncomingMessage(event: ChatSocketEvent): void {
        const chat = this.chats.find((item) => item.id === event.match_id);
        if (!chat) {
            // Only refresh if not searching, otherwise the new chat might not match search
            if (!this.searchQuery) {
                void this.fetchChats();
            }
            return;
        }

        chat.lastMessage = event.content || chat.lastMessage;
        chat.timestamp = this.formatTimestamp(event.created_at) || chat.timestamp;
        chat.lastMessageDate = event.created_at
            ? Date.parse(event.created_at)
            : Date.now();

        if (event.sender_id && event.sender_id !== this.currentUserId) {
            chat.unreadCount += 1;
        }

        this.sortChats();
        void this.renderChatsList();
    }

    private clearUnread(chatId?: string): void {
        if (!chatId) return;
        const chat = this.chats.find((item) => item.id === chatId);
        if (chat) {
            chat.unreadCount = 0;
            void this.renderChatsList();
        }
    }
}

export default new ChatsListStore();
