import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { support } from './support';

class SupportStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_SUPPORT:
                await support.render();
                break;
        
            default:
                break;
        }
    }

}

export default new SupportStore();
