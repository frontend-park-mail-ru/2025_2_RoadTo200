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
    otherUserId?: string;
    isLoading?: boolean;
    isInputDisabled?: boolean;
    placeholder?: PlaceholderState;
    socketStatus?: string;
    draft?: string;
    draftLength?: number;
    isInitialLoad?: boolean;
}

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон окна чата');
        }
        return await response.text();
    } catch (error) {
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

        // Save current scroll position before re-render
        const bodyContainer = this.parent.querySelector('.chat-window__body') as HTMLElement;
        const savedScrollTop = bodyContainer?.scrollTop || 0;
        const savedScrollHeight = bodyContainer?.scrollHeight || 0;
        const wasAtBottom = bodyContainer 
            ? (savedScrollHeight - savedScrollTop - bodyContainer.clientHeight) < 100
            : true;

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({
            messages: data.messages,
            hasMessages: data.messages.length > 0,
            chatId: data.chatId,
            otherUserName: data.otherUserName,
            otherUserPhoto: data.otherUserPhoto,
            otherUserInitials: data.otherUserInitials,
            otherUserId: data.otherUserId,
            isLoading: data.isLoading,
            isInputDisabled: data.isInputDisabled,
            placeholder: data.placeholder,
            socketStatus: data.socketStatus,
            draft: data.draft || '',
            draftLength: typeof data.draftLength === 'number'
                ? data.draftLength
                : (data.draft || '').length,
        });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();
        
        // Restore scroll position after re-render
        const newBodyContainer = this.parent.querySelector('.chat-window__body') as HTMLElement;
        if (newBodyContainer) {
            if (data.isInitialLoad) {
                // On initial load, show latest messages at bottom
                newBodyContainer.scrollTop = newBodyContainer.scrollHeight;
            } else if (wasAtBottom) {
                // If user was at bottom, stay at bottom (for new messages)
                newBodyContainer.scrollTop = newBodyContainer.scrollHeight;
            } else {
                // Otherwise restore the exact position (user reading history)
                newBodyContainer.scrollTop = savedScrollTop;
            }
        }
        
        // Auto-focus input when chat is selected
        if (data.chatId && !data.isInputDisabled) {
            const input = this.parent.querySelector('.chat-window__input') as HTMLTextAreaElement;
            if (input) {
                setTimeout(() => input.focus(), 0);
            }
        }
    }

    private handleCloseChat = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Сбрасываем текущий выбранный чат через store
        if (typeof document !== 'undefined') {
            const chatsPage = document.querySelector('.chats-page');
            if (chatsPage) {
                chatsPage.classList.remove('chats-page--conversation-open');
            }
        }
        
        // Рендерим пустое окно чата
        dispatcher.process({
            type: Actions.RENDER_CHAT_WINDOW,
        });
    };

    private initEventListeners(): void {
        if (!this.parent) return;

        const form = this.parent.querySelector('.chat-window__input-form') as HTMLFormElement;
        const input = this.parent.querySelector('.chat-window__input') as HTMLInputElement;
        const sendButton = this.parent.querySelector('.chat-window__send-btn') as HTMLButtonElement;
        const counter = this.parent.querySelector('.chat-window__counter') as HTMLSpanElement;

        const handleSend = (event: Event) => {
            event.preventDefault();
            const text = input.value.trim();
            
            if (text) {
                dispatcher.process({
                    type: Actions.SEND_MESSAGE,
                    payload: { text },
                });
                input.value = '';
                if (counter) {
                    counter.textContent = '0 / 250';
                }
                dispatcher.process({
                    type: Actions.CHAT_UPDATE_DRAFT,
                    payload: { chatId: form.dataset.chatId || '', text: '' },
                });
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

                if (counter) {
                    const currentLength = input.value.length;
                    const maxLength = 250; 

                    counter.textContent = `${currentLength} / ${maxLength}`;
                }
                dispatcher.process({
                    type: Actions.CHAT_UPDATE_DRAFT,
                    payload: { chatId: form.dataset.chatId || '', text: input.value },
                });
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

        const profileButton = this.parent.querySelector(
            '[data-action="open-profile"]'
        ) as HTMLElement | null;

        if (profileButton) {
            profileButton.addEventListener('click', (event) => {
                // Не переходим на профиль если кликнули на кнопку закрытия
                const target = event.target as HTMLElement;
                if (target.closest('[data-action="close-chat"]')) {
                    return;
                }
                
                const userId = profileButton.dataset.userId;
                if (userId) {
                    dispatcher.process({
                        type: Actions.NAVIGATE_TO,
                        payload: { path: `/profile/${userId}` },
                    });
                }
            });
        }

        const closeButton = this.parent.querySelector(
            '[data-action="close-chat"]'
        ) as HTMLButtonElement | null;

        if (closeButton) {
            // Удаляем старый обработчик если есть
            closeButton.removeEventListener('click', this.handleCloseChat);
            // Добавляем новый
            closeButton.addEventListener('click', this.handleCloseChat);
        }
    }

}

export const chatWindow = new ChatWindow(document.createElement('div'));
