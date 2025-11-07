import { Actions, Action, LoginAction, ErrorAction } from "../../actions";
import { dispatcher } from "../../Dispatcher";
import { login } from "./login";
import type { Store } from "../../Dispatcher";

import AuthApi from "../../apiHandler/authApi";

class LoginStore implements Store {
    constructor() {
        console.log("created");
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_LOGIN:
                await login.render();
                break;
            
            case Actions.REQUEST_LOGIN:
                await this.processLogin(action as LoginAction);
                break;
        }
    }

    private async processLogin(action: LoginAction): Promise<void> {
        const { email, password } = action.payload!;

        try {
            await AuthApi.login(email, password);
            
            dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/' }
            });
        } catch (error) {
            console.error('Login error:', error);
            
            // Показываем пользователю дружелюбное сообщение, а не raw ошибку с бекенда
            dispatcher.process({
                type: Actions.LOGIN_ERROR,
                payload: { message: 'Неверный email или пароль' }
            } as ErrorAction);
        }
    }
}

export default new LoginStore();
