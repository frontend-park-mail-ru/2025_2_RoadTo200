import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { home } from './home';

class HomeStore implements Store {
    selectedActivities: string[] = [];

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_HOME:
                await home.render();
                break;
            default:
                break;
        }
    }

    setSelectedActivities(activities: string[]): void {
        this.selectedActivities = activities;
    }

    getSelectedActivities(): string[] {
        return this.selectedActivities;
    }
}

export default new HomeStore();
