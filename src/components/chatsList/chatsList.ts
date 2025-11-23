import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/ChatsList/chatsList.hbs';

interface Chat {
    id: string;
    userId: string;
    userName: string;
    userAge: number;
    userAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    isSelected?: boolean;
}

interface ChatsListData {
    chats: Chat[];
    selectedChatId?: string;
}

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон списка чатов');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона списка чатов:', error);
        return '<div></div>';
    }
};

export class ChatsList implements PageComponent {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: ChatsListData = { chats: [] }): Promise<void> {
        if (!this.parent) return;

        const { chats, selectedChatId } = data;

        console.log('ChatsList: Rendering with chats:', chats, 'and selectedChatId:', selectedChatId);

        const chatsWithSelection = chats.map((chat) => ({
            ...chat,
            isSelected: chat.id === selectedChatId,
        }));

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        console.log('ChatsList: Compiled template:', templateString);

        const renderedHtml = template({
            chats: chatsWithSelection,
            hasChats: chats.length > 0,
        });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (!this.parent) return;

        const chatItems = this.parent.querySelectorAll('.chat-item');

        chatItems.forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const chatId = (item as HTMLElement).dataset.chatId;
                
                if (chatId) {
                    dispatcher.process({
                        type: Actions.SELECT_CHAT,
                        payload: { chatId },
                    });
                }
            });
        });
    }
}

export const chatsList = new ChatsList(document.createElement('div'));
