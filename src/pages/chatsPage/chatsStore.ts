import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { chats } from './chats';

class ChatsPageStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_CHATS:
                if (typeof document === 'undefined') {
                    return;
                }

                if (!chats.parent) {
                    const rootContainer = document.getElementById('root');
                    if (rootContainer) {
                        chats.parent = rootContainer;
                    } else {
                        return;
                    }
                }

                await chats.render();


                dispatcher.process({ type: Actions.RENDER_CHAT_WINDOW });
                
                dispatcher.process({ type: Actions.RENDER_CHATS_LIST });

                break;

            default:
                break;
        }
    }
}

export default new ChatsPageStore();