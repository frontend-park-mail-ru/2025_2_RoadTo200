import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { register } from "./register.js"

import AuthApi from "../../apiHandler/authApi.js" 

class RegisterStore {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action){
        switch (action.type){
            case Actions.RENDER_REGISTER:
                await register.render();
                break;
            
            case Actions.REQUEST_REGISTER:
                await this.processRegister(action.payload);
                break;
        }
    }

    
    async processRegister(payload) {
        const { email, password, passwordConfirm} = payload; 

        try {
            await AuthApi.register(email, password, passwordConfirm); 
            
            window.history.pushState(null, null, '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            // Отправляем ошибку через Flux архитектуру
            dispatcher.process({
                type: Actions.REGISTER_ERROR,
                payload: { message: error.message || 'Неверный email или пароль' }
            });
        }
    }
}

export default new RegisterStore();