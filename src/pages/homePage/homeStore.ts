import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { home } from './home';
import ProfileApi from '@/apiHandler/profileApi';
import { ProfileSetupPopup } from '@/components/ProfileSetupPopup/profileSetupPopup';

class HomeStore implements Store {
    selectedActivities: string[] = [];

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_HOME:
                await home.render();
                await this.checkProfileCompleteness();
                break;
            case Actions.UPDATE_ACTIVITY:
                if (action.payload && typeof action.payload === 'object') {
                    await this.updateActivity(
                        action.payload as Record<string, boolean>
                    );
                }
                break;
            default:
                break;
        }
    }

    private async checkProfileCompleteness(): Promise<void> {
        try {
            // console.log('HomeStore: Checking profile completeness...');
            const isComplete = await ProfileSetupPopup.isProfileComplete();
            // console.log('HomeStore: Profile is complete:', isComplete);

            if (!isComplete) {
                // Показываем попап для заполнения профиля
                // console.log('HomeStore: Showing profile setup popup...');
                dispatcher.process({ type: Actions.SHOW_PROFILE_SETUP_POPUP });
            } else {
                // Профиль заполнен, загружаем активности пользователя
                // console.log('HomeStore: Profile is complete, loading user activities...');
                await this.loadUserActivities();
            }
        } catch (error) {
            // console.error('HomeStore: Error checking profile completeness:', error);
            // В случае ошибки пытаемся загрузить активности
            await this.loadUserActivities();
        }
    }

    private async loadUserActivities(): Promise<void> {
        try {
            const response = await ProfileApi.getProfile();
            const interests = response.interests || [];

            // Extract themes from interests
            const activeActivities = interests.map((interest) => interest.theme);

            // Update store state
            this.selectedActivities = activeActivities;

            // Update UI
            home.setActiveActivities(activeActivities);

            // console.log('HomeStore: Loaded user activities:', activeActivities);
        } catch (error) {
            // console.error('HomeStore: Failed to load user activities:', error);
        }
    }

    private async updateActivity(
        activityData: Record<string, boolean>
    ): Promise<void> {
        try {
            // Update local state based on the change
            Object.entries(activityData).forEach(([activityId, isSelected]) => {
                if (isSelected) {
                    if (!this.selectedActivities.includes(activityId)) {
                        this.selectedActivities.push(activityId);
                    }
                } else {
                    this.selectedActivities = this.selectedActivities.filter(
                        (id) => id !== activityId
                    );
                }
            });

            // Prepare payload for API
            const interestsPayload = this.selectedActivities.map((theme) => ({
                theme,
            }));

            await ProfileApi.updateInterests(interestsPayload);
            // console.log('HomeStore: Interests updated:', interestsPayload);

            // Reload to ensure sync (optional, but good for consistency)
            await this.loadUserActivities();
        } catch (error) {
            // console.error('HomeStore: Failed to update activity:', error);
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
