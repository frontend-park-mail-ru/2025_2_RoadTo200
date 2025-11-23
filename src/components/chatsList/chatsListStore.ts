import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { chatsList } from './chatsList';
import type { Store } from '../../Dispatcher';

interface Chat {
    id: string;
    userId: string;
    userName: string;
    userAge: number;
    userAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
}

class ChatsListStore implements Store {
    private chats: Chat[] = [];
    private selectedChatId: string | null = null;
    private chatsListComponent = chatsList;

    constructor() {
        dispatcher.register(this);
        this.fetchChats();
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_CHATS_LIST:
                console.log('ChatsListStore: RENDER_CHATS_LIST action received');
                await this.renderChatsList();
                break;
            
            case Actions.SELECT_CHAT:
                if (action.payload && (action.payload as { chatId: string }).chatId) {
                    this.selectedChatId = (action.payload as { chatId: string }).chatId;
                    await this.renderChatsList();
                }
                break;
            
            case Actions.LOAD_CHATS:
                await this.fetchChats();
                await this.renderChatsList();
                break;
            
            default:
                break;
        }
    }

    private async fetchChats(): Promise<void> {
        this.chats = [
            {
                id: '1',
                userId: 'user1',
                userName: 'Kirill',
                userAge: 19,
                userAvatar: '/src/assets/avatars/kirill.jpg',
                lastMessage: 'Привет! Улыбка у тебя супер!',
                timestamp: '14:32',
                unread: true,
            },
            {
                id: '2',
                userId: 'user2',
                userName: 'Kirill',
                userAge: 19,
                userAvatar: '/src/assets/avatars/kirill.jpg',
                lastMessage: 'Привет! Улыбка у тебя супер!',
                timestamp: '12:15',
                unread: false,
            },
            {
                id: '3',
                userId: 'user3',
                userName: 'Kirill',
                userAge: 19,
                userAvatar: '/src/assets/avatars/kirill.jpg',
                lastMessage: 'Привет! Улыбка у тебя супер!',
                timestamp: 'Вчера',
                unread: false,
            },
            {
                id: '4',
                userId: 'user4',
                userName: 'Kirill',
                userAge: 19,
                userAvatar: '/src/assets/avatars/kirill.jpg',
                lastMessage: 'Привет! Улыбка у тебя супер! суперс...',
                timestamp: '23.11.2024',
                unread: false,
            },
        ];
    }

    private async renderChatsList(): Promise<void> {
        const data = {
            chats: this.chats,
            selectedChatId: this.selectedChatId ?? undefined,
        };

        console.log('ChatsListStore: Rendering chats list with data:', data);
        await this.chatsListComponent.render(data);
    }
}

export default new ChatsListStore();
