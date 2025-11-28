import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { statistics } from './statistics';
import statisticsApi, { StatisticsResponse } from '@/apiHandler/statisticsApi';

class StatisticsStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_STATISTICS:
                try {
                    const response: StatisticsResponse = await statisticsApi.getStatistics();

                    await statistics.render(response);

                } catch (error) {
                    // Failed to fetch statistics
                }
                break;

            default:
                break;
        }
    }

}

export default new StatisticsStore();