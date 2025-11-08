import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { profileSetupPopup } from './profileSetupPopup';

class ProfileSetupPopupStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.SHOW_PROFILE_SETUP_POPUP:
                await this.showPopup();
                break;
            case Actions.HIDE_PROFILE_SETUP_POPUP:
                // Пока не нужно, popup закрывается сам после сохранения
                break;
            default:
                break;
        }
    }

    private async showPopup(): Promise<void> {
        // Callback после завершения заполнения профиля
        await profileSetupPopup.show(() => {
            // После успешного заполнения профиля загружаем карточки
            dispatcher.process({ type: Actions.GET_CARDS });
        });
    }
}

export default new ProfileSetupPopupStore();
