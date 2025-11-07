import { dispatcher, type Store } from '@/Dispatcher';
import { Actions, type Action, type RegisterPayload } from '@/actions';
import { register } from './register';
import AuthApi from '@/apiHandler/authApi';

class RegisterStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_REGISTER:
                await register.render();
                break;

            case Actions.REQUEST_REGISTER:
                await this.processRegister(action.payload as RegisterPayload);
                break;

            default:
                break;
        }
    }

    private async processRegister(payload: RegisterPayload): Promise<void> {
        const { email, password, passwordConfirm } = payload;

        try {
            await AuthApi.register(email, password, passwordConfirm);
            
            await dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/' }
            });
        } catch (error) {
            console.error('Register error:', error);
            
            await dispatcher.process({
                type: Actions.REGISTER_ERROR,
                payload: 'Ошибка регистрации',
            });
        }
    }
}

export const registerStore = new RegisterStore();

