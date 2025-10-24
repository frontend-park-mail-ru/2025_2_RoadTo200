import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { login } from "./login.js"

import AuthApi from "../../apiHandler/authApi.js"

class LoginStore {
    constructor() {
        console.log("created")
        dispatcher.register(this);
    }

    async handleAction(action){
        switch (action.type){
            case Actions.RENDER_LOGIN:
                await login.render();
                break;
            
            case Actions.REQUEST_LOGIN:
                await this.processLogin(action.payload);
                break;
        }
    }

    
    async processLogin(payload) {
        const { email, password } = payload;

        try {
            const data = await AuthApi.login(email, password);
            
            window.history.pushState(null, null, '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            // Отправляем ошибку через Flux архитектуру
            dispatcher.process({
                type: Actions.LOGIN_ERROR,
                payload: { message: error.message || 'Неверный email или пароль' }
            });
        }
    }
}

export default new LoginStore();