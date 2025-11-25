import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/chatWindow/chatWindow.hbs';

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    isMine: boolean;
}

interface PlaceholderState {
    title: string;
    subtitle: string;
    action?: 'home' | 'list';
}

interface ChatWindowData {
    messages: Message[];
    chatId: string | null;
    otherUserName?: string;
    otherUserPhoto?: string;
    otherUserInitials?: string;
    isLoading?: boolean;
    isInputDisabled?: boolean;
    placeholder?: PlaceholderState;
    socketStatus?: string;
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
            this.parent.innerHTML =
                '<div class="chat-window"><div class="chat-window__placeholder"><h3>Выберите чат</h3><p>Общение начнется здесь</p></div></div>';
            return;
        }

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({
            messages: data.messages,
            hasMessages: data.messages.length > 0,
            chatId: data.chatId,
            otherUserName: data.otherUserName,
            otherUserPhoto: data.otherUserPhoto,
            otherUserInitials: data.otherUserInitials,
            isLoading: data.isLoading,
            isInputDisabled: data.isInputDisabled,
            placeholder: data.placeholder,
            socketStatus: data.socketStatus,
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

        if (form && input && sendButton) {
            form.addEventListener('submit', handleSend);
            sendButton.addEventListener('click', handleSend);

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) { 
                    event.preventDefault(); 
                    handleSend(event); 
                }
            });

            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = input.scrollHeight + 'px';
            });
        }

        const backButton = this.parent.querySelector(
            '[data-action="back-to-list"]'
        ) as HTMLButtonElement | null;

        if (backButton && typeof document !== 'undefined') {
            backButton.addEventListener('click', () => {
                document.querySelector('.chats-page')?.classList.remove('chats-page--conversation-open');
            });
        }

        const homeButton = this.parent.querySelector(
            '[data-action="go-home"]'
        ) as HTMLButtonElement | null;

        if (homeButton) {
            homeButton.addEventListener('click', () => {
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/' },
                });
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
