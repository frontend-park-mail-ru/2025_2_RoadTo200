import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { login } from "./login.js"
import router from "../../../app.js";

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
            
            router.navigateTo('/');
        } catch (error) {
            console.error('Login error:', error);
            
            // Показываем пользователю дружелюбное сообщение, а не raw ошибку с бекенда
            dispatcher.process({
                type: Actions.LOGIN_ERROR,
                payload: { message: 'Неверный email или пароль' }
            });
        }
    }
}

export default new LoginStore();