import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { home } from './home';
import ProfileApi from '@/apiHandler/profileApi';

class HomeStore implements Store {
    selectedActivities: string[] = [];

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_HOME:
                await home.render();
                await this.loadUserActivities();
                break;
            case Actions.UPDATE_ACTIVITY:
                if (action.payload && typeof action.payload === 'object') {
                    await this.updateActivity(action.payload as Record<string, boolean>);
                }
                break;
            default:
                break;
        }
    }

    private async loadUserActivities(): Promise<void> {
        try {
            const response = await ProfileApi.getProfile();
            const profile = response.profile;
            
            // Собираем активные активности
            const activeActivities: string[] = [];
            const activityIds = ['workout', 'fun', 'party', 'chill', 'love', 'relax', 'yoga', 'friendship', 'culture', 'cinema'];
            
            activityIds.forEach(activityId => {
                if (profile[activityId as keyof typeof profile] === true) {
                    activeActivities.push(activityId);
                }
            });
            
            // Устанавливаем активные активности в Home компонент
            home.setActiveActivities(activeActivities);
            
            console.log('Loaded user activities:', activeActivities);
        } catch (error) {
            console.error('Failed to load user activities:', error);
        }
    }

    private async updateActivity(activityData: Record<string, boolean>): Promise<void> {
        try {
            await ProfileApi.updateActivities(activityData);
            console.log('Activity updated:', activityData);
        } catch (error) {
            console.error('Failed to update activity:', error);
            // Можно добавить обработку ошибки через dispatcher
            // dispatcher.process({ type: Actions.SHOW_ERROR, payload: { message: 'Не удалось обновить активность' } });
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