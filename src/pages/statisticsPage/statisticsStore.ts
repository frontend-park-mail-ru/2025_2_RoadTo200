import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { statistics } from './statistics';

class StatisticsStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_STATISTICS:
                await statistics.render();
                break;
        
            default:
                break;
        }
    }

}

export default new StatisticsStore();