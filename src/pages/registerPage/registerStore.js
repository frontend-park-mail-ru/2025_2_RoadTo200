import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { register } from "./register.js"
import router from "../../../app.js";

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
            
            router.navigateTo('/');
        } catch (error) {
            console.error('Registration error:', error);
            
            // Показываем пользователю дружелюбное сообщение
            dispatcher.process({
                type: Actions.REGISTER_ERROR,
                payload: { message: 'Ошибка при регистрации. Проверьте данные и попробуйте снова.' }
            });
        }
    }
}

export default new RegisterStore();