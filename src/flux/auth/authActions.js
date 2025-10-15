import AuthApi from '../../apiHandler/authApi.js';

import Dispatcher from '../Dispatcher.js';

class AuthActions {

    async sendLoginRequest(email, password) {

        console.log(email, password)
        try {
            const data = await AuthApi.login(email, password);
    
            Dispatcher.process({
                type: 'LOGIN_SUCCESS',
                payload: data.user
            });
        } catch (error) {
            console.error('Ошибка при входе:', error);
          
            Dispatcher.process({
                type: 'LOGIN_ERROR',
                payload: error,
            });
        }
    };

    async sendRegisterRequest(email, password, passwordConfirm){
        try {
            const data = await AuthApi.register(email, password, passwordConfirm);
            Dispatcher.process({
                type: 'REGISTER_SUCCESS',
                payload: data.user
            });
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            Dispatcher.process({
                type: 'REGISTER_ERROR',
                payload: error,
            });
        }
    };

    async sendLogoutRequest(){
        try{
            await AuthApi.logout();
            Dispatcher.process({
                type: 'LOGOUT_SUCCESS'
            });
        }catch (error) {
            console.error('Ошибка при выходе:', error);
        }
    }

    async sendCheckRequest() {
        try {
            const response = await AuthApi.checkAuth();
            return response.authenticated || false;
        } catch (error) {
            console.error('Ошибка проверки аутентификации:', error);
            return false;
        }
    }
}

export default new AuthActions();