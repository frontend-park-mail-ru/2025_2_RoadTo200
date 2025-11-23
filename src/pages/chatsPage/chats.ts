const TEMPLATE_PATH = '/src/pages/chatsPage/chatsPage.hbs';

import { chatsList } from '@/components/chatsList/chatsList';
import { chatWindow } from '@/components/chatWindow/chatWindow';

const fetchTemplate = async (path: string): Promise<string> => {
    try {
        console.log('Fetching template from:', path);
        const response = await fetch(path);
        console.log('Template response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        return text;
    } catch (error) {
        return '<div>Error: Could not load template</div>';
    }
};

export class ChatsPage {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(): Promise<void> {
        
        if (!this.parent) {
            this.parent = document.getElementById('root');
            if (!this.parent) {
                return;
            }
        }

        const template = `
            <div class="chats-page">
                <div class="chats-page__sidebar">
                    <div class="chats-page__header">
                        <h1 class="chats-page__title">Чаты</h1>
                    </div>
                    <div id="chatsListContainer" class="chats-page__list"></div>
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