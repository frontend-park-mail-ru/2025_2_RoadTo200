import { chatsList } from '@/components/chatsList/chatsList';
import { chatWindow } from '@/components/chatWindow/chatWindow';

export class ChatsPage {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(): Promise<void> {

        if (!this.parent) {
            this.parent = document.getElementById('content-container');
            if (!this.parent) {
                return;
            }
        }

        const template = `
            <div class="chats-page">
                <div class="chats-page__sidebar">
                    <div id="chatsListContainer"></div>
                </div>
                <div class="chats-page__main">
                    <div id="chatWindowContainer" class="chats-page__window"></div>
                </div>
            </div>
        `;

        this.parent.innerHTML = template;

        const chatsListContainer = this.parent.querySelector('#chatsListContainer') as HTMLElement;
        const chatWindowContainer = this.parent.querySelector('#chatWindowContainer') as HTMLElement;

        if (chatsListContainer) {
            chatsList.parent = chatsListContainer;
        }

        if (chatWindowContainer) {
            chatWindow.parent = chatWindowContainer;
        }
    }
}

export const chats = new ChatsPage(null);