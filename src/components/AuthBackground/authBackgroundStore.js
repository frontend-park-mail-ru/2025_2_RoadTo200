import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { authBackground } from "./authBackground.js";

class AuthBackgroundStore {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_AUTH_BACKGROUND:
                await this.showBackground();
                break;
            
            case Actions.HIDE_AUTH_BACKGROUND:
                await this.hideBackground();
                break;
        }
    }

    async showBackground() {
        const root = document.getElementById('root');
        let bgElement = document.querySelector('.auth-background');
        
        
        if (!bgElement) {
            bgElement = document.createElement('div');
            bgElement.className = 'auth-background';
            bgElement.innerHTML = `
                <div class="circle-activity-tablet" aria-hidden="true">
                    Сайт для поиска друзей и партнеров
                </div>
            `;
            document.body.insertBefore(bgElement, root);
            
            
            authBackground.setContainer(bgElement);
            authBackground.render();
        } else {
            // Фон уже создан, просто показываем
            bgElement.style.display = 'block';
        }
    }

    hideBackground() {
        const bgElement = document.querySelector('.auth-background');
        if (bgElement) {
            bgElement.style.display = 'none';
        }
    }
}

export default new AuthBackgroundStore();
