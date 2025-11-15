import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { statistics } from './statistics';
// Import the API client and required types from the API file
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
                    
                    console.log('Fetched statistics data:', response);
                    await statistics.render(response);
                    
                } catch (error) {
                    console.error('Failed to fetch and render statistics:', error);
                }
                break;
        
            default:
                break;
        }
    }

}

export default new StatisticsStore();