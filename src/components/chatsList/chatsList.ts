import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { PageComponent } from '../../navigation/navigationStore';

const TEMPLATE_PATH = '/src/components/chatsList/chatsList.hbs';

interface ChatListItem {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    initials: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isSelected?: boolean;
}

interface ChatsListData {
    chats: ChatListItem[];
    selectedChatId?: string;
    searchQuery?: string;
    isLoading?: boolean;
    emptyState?: {
        title: string;
        subtitle: string;
    };
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
    private searchTimer: number | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(data: ChatsListData = { chats: [] }): Promise<void> {
        if (!this.parent) return;

        const { chats, selectedChatId, searchQuery, isLoading, emptyState } = data;

        const searchInput = this.parent.querySelector(
            '.chats-sidebar__search-input'
        ) as HTMLInputElement | null;
        const hadFocus = searchInput === document.activeElement;
        const cursorPosition = hadFocus ? searchInput?.selectionStart ?? 0 : 0;

        const chatsWithSelection = chats.map((chat) => ({
            ...chat,
            isSelected: chat.id === selectedChatId,
        }));

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);

        const renderedHtml = template({
            chats: chatsWithSelection,
            hasChats: chats.length > 0,
            searchQuery,
            isLoading,
            emptyState,
        });

        this.parent.innerHTML = renderedHtml;
        this.initEventListeners();

        if (hadFocus) {
            const newSearchInput = this.parent.querySelector(
                '.chats-sidebar__search-input'
            ) as HTMLInputElement | null;
            if (newSearchInput) {
                newSearchInput.focus();
                newSearchInput.setSelectionRange(cursorPosition, cursorPosition);
            }
        }
    }

    private initEventListeners(): void {
        if (!this.parent) return;

        const chatItems = this.parent.querySelectorAll('.chat-item');

        chatItems.forEach((item) => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const chatId = (item as HTMLElement).dataset.chatId;
                const userName = (item as HTMLElement).dataset.userName || '';
                const userPhoto = (item as HTMLElement).dataset.userPhoto || '';

                if (chatId) {
                    dispatcher.process({
                        type: Actions.SELECT_CHAT,
                        payload: { chatId, userName, userPhoto },
                    });
                    if (typeof document !== 'undefined') {
                        document
                            .querySelector('.chats-page')
                            ?.classList.add('chats-page--conversation-open');
                    }
                }
            });
        });

        const searchInput = this.parent.querySelector(
            '.chats-sidebar__search-input'
        ) as HTMLInputElement | null;

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (this.searchTimer) {
                    clearTimeout(this.searchTimer);
                }

                const value = searchInput.value;
                this.searchTimer = window.setTimeout(() => {
                    dispatcher.process({
                        type: Actions.UPDATE_CHAT_SEARCH,
                        payload: { query: value },
                    });
                }, 300);
            });
        }

        const emptyButton = this.parent.querySelector(
            '[data-action="go-home"]'
        ) as HTMLButtonElement | null;

        if (emptyButton) {
            emptyButton.addEventListener('click', () => {
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/' },
                });
            });
        }
    }
}

export const chatsList = new ChatsList(document.createElement('div'));
