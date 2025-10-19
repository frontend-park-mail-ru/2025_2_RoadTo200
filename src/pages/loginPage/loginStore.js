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
            
            // хз насчет этого: насколько это адекватно flux'у или лучше сделать LOGIN_SUCCESS и LOGIN_REJECT, а реквест делать во вью?
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
            alert("Ошибка при входе"); // пока что так, насчет ошибок Илья работает
        }
    }
}

export default new LoginStore();