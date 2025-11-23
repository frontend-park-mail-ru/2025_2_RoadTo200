import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { chatWindow } from './chatWindow';
import type { Store } from '../../Dispatcher';

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    isMine: boolean;
}

interface Chat {
    id: string;
    userId: string;
    userName: string;
    userAge: number;
    messages: Message[];
}

class ChatWindowStore implements Store {
    private currentChatId: string | null = null;
    private chats: Map<string, Chat> = new Map();
    private currentUserId = 'me'; // Current user ID
    private chatWindowComponent = chatWindow;

    constructor() {
        dispatcher.register(this);
        this.loadMockData();
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.SELECT_CHAT:
                if (action.payload && (action.payload as { chatId: string }).chatId) {
                    this.currentChatId = (action.payload as { chatId: string }).chatId;
                    await this.renderChatWindow();
                }
                break;
            
            case Actions.SEND_MESSAGE:
                if (action.payload && (action.payload as { text: string }).text) {
                    await this.sendMessage((action.payload as { text: string }).text);
                }
                break;
            
            case Actions.LOAD_CHAT_MESSAGES:
                if (action.payload && (action.payload as { chatId: string }).chatId) {
                    await this.loadMessages((action.payload as { chatId: string }).chatId);
                }
                break;
            
            default:
                break;
        }
    }

    private async sendMessage(text: string): Promise<void> {
        if (!this.currentChatId) return;

        const chat = this.chats.get(this.currentChatId);
        if (!chat) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            text,
            senderId: this.currentUserId,
            timestamp: new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            isMine: true,
        };

        chat.messages.push(newMessage);
        await this.renderChatWindow();

        // Mock response after 1 second
        setTimeout(() => {
            this.simulateResponse();
        }, 1000);
    }

    private simulateResponse(): void {
        if (!this.currentChatId) return;

        const chat = this.chats.get(this.currentChatId);
        if (!chat) return;

        const responses = [
            'Спасибо! Ты тоже классный!',
            'Очень приятно 😊',
            'Давай познакомимся поближе?',
            'Как твои дела?',
        ];

        const responseMessage: Message = {
            id: `msg-${Date.now()}`,
            text: responses[Math.floor(Math.random() * responses.length)],
            senderId: chat.userId,
            timestamp: new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            isMine: false,
        };

        chat.messages.push(responseMessage);
        this.renderChatWindow();
    }

    private async loadMessages(chatId: string): Promise<void> {
        // Mock API call - replace with actual API
        // const response = await fetch(`/api/chats/${chatId}/messages`);
        // const messages = await response.json();
        
        this.currentChatId = chatId;
        await this.renderChatWindow();
    }

    private loadMockData(): void {
        // Mock chat data
        this.chats.set('1', {
            id: '1',
            userId: 'user1',
            userName: 'Kirill',
            userAge: 19,
            messages: [
                {
                    id: 'msg1',
                    text: 'Привет! Улыбка у тебя супер!',
                    senderId: 'user1',
                    timestamp: '14:30',
                    isMine: false,
                },
                {
                    id: 'msg2',
                    text: 'Спасибо! Чем ты занимаешься?',
                    senderId: 'me',
                    timestamp: '14:32',
                    isMine: true,
                },
                {
                    id: 'msg3',
                    text: 'На самом деле я человек довольно творческий – работаю графическим дизайнером, люблю придумывать визуальные концепции и экспериментировать с цветом. В свободное время часто хожу по музеям и старым улицам, фотографирую детали - трещины на стенах, отражения в окнах, случайные надписи. Кажется, в таких мелочах больше жизни, чем в идеально выстроенных кадрах. А ещё люблю кофе с корицей и вечерние разговоры под музыку из старого плейлиста.',
                    senderId: 'user1',
                    timestamp: '14:35',
                    isMine: false,
                },
                {
                    id: 'msg4',
                    text: 'Привет! Улыбка у тебя супер!',
                    senderId: 'me',
                    timestamp: '14:40',
                    isMine: true,
                },
            ],
        });

        this.chats.set('2', {
            id: '2',
            userId: 'user2',
            userName: 'Kirill',
            userAge: 19,
            messages: [
                {
                    id: 'msg1',
                    text: 'Привет! Улыбка у тебя супер!',
                    senderId: 'user2',
                    timestamp: '12:10',
                    isMine: false,
                },
            ],
        });
    }

    private async renderChatWindow(): Promise<void> {
        if (!this.currentChatId) {
            await this.chatWindowComponent.render({
                messages: [],
                chatId: null,
            });
            return;
        }

        const chat = this.chats.get(this.currentChatId);
        if (!chat) return;

        const data = {
            messages: chat.messages,
            chatId: this.currentChatId,
            otherUserName: chat.userName,
            otherUserAge: chat.userAge,
        };

        await this.chatWindowComponent.render(data);
    }
}

export default new ChatWindowStore();
