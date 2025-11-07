import { Actions } from '../../actions';
import { dispatcher } from '../../Dispatcher';
import type { Store } from '../../Dispatcher';
import { authBackground } from './authBackground';

interface Action {
    type: string;
    payload?: any;
}

class AuthBackgroundStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_AUTH_BACKGROUND:
                await this.showBackground();
                break;
            
            case Actions.HIDE_AUTH_BACKGROUND:
                await this.hideBackground();
                break;
        }
    }

    async showBackground(): Promise<void> {
        const root = document.getElementById('root');
        let bgElement = document.querySelector('.auth-background') as HTMLElement;
        
        if (!bgElement) {
            bgElement = document.createElement('div');
            bgElement.className = 'auth-background';
            bgElement.innerHTML = `
                <div class="auth-background__circle-activity-tablet" aria-hidden="true">
                    Сайт для поиска друзей и партнеров
                </div>
            `;
            if (root) {
                document.body.insertBefore(bgElement, root);
            }
            
            authBackground.setContainer(bgElement);
            authBackground.render();
        } else {
            // Фон уже создан, просто показываем
            bgElement.style.display = 'block';
        }
    }

    hideBackground(): void {
        const bgElement = document.querySelector('.auth-background') as HTMLElement;
        if (bgElement) {
            bgElement.style.display = 'none';
        }
    }
}

export default new AuthBackgroundStore();
