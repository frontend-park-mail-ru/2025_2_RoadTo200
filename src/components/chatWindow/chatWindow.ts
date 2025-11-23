import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/ChatWindow/chatWindow.hbs';

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    isMine: boolean;
}

interface ChatWindowData {
    messages: Message[];
    chatId: string | null;
    otherUserName?: string;
    otherUserAge?: number;
}

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон окна чата');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона окна чата:', error);
        return '<div></div>';
    }
};

export class ChatWindow implements PageComponent {
    parent: HTMLElement | null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data?: ChatWindowData): Promise<void> {
        if (!this.parent) return;
        
        if (!data) {
            this.parent.innerHTML = '<div class="chat-window"><div class="chat-window__no-chat"><p>Выберите чат для начала общения</p></div></div>';
            return;
        }

        const { messages, chatId, otherUserName, otherUserAge } = data;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({
            messages,
            hasMessages: messages.length > 0,
            chatId,
            otherUserName,
            otherUserAge,
        });

        this.parent.innerHTML = renderedHtml;
        this.scrollToBottom();
        this.initEventListeners();
    }

    private initEventListeners(): void {
        if (!this.parent) return;

        const form = this.parent.querySelector('.chat-window__input-form') as HTMLFormElement;
        const input = this.parent.querySelector('.chat-window__input') as HTMLInputElement;
        const sendButton = this.parent.querySelector('.chat-window__send-btn') as HTMLButtonElement;

        if (form && input && sendButton) {
            const handleSend = (event: Event) => {
                event.preventDefault();
                const text = input.value.trim();
                
                if (text) {
                    dispatcher.process({
                        type: Actions.SEND_MESSAGE,
                        payload: { text },
                    });
                    input.value = '';
                }
            };

            form.addEventListener('submit', handleSend);
            sendButton.addEventListener('click', handleSend);

            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
            });
        }
    }

    private scrollToBottom(): void {
        if (!this.parent) return;
        
        const messagesContainer = this.parent.querySelector('.chat-window__messages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }
}

export const chatWindow = new ChatWindow(document.createElement('div'));
