import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';
import Header from './header.js';

import AuthApi from '../../apiHandler/authApi.js';

const headerRootElement = document.getElementById('header-container'); 

class HeaderStore{
    user; 
    isAuthenticated;

    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_HEADER:
                await this.processCheckAuth();
                console.log(this.user);
                await this.renderHeader(); 
                break;

            case Actions.AUTH_STATE_UPDATED:
                await this.updateUserState(action.payload);
                break;

            case Actions.REQUEST_LOGOUT:
                await this.processLogout();
                break;

            default:
                break;
        }
    }

    async processCheckAuth() {
        try {
            const response = await AuthApi.checkAuth();
            const user = response.user || null;
            
            this.user = user;
            this.isAuthenticated = !!user;

        } catch (error) {
            this.user = null;
            this.isAuthenticated = false;
        }
    }

    async processLogout() {
        try {
            await AuthApi.logout(); 

            this.user = null;

            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: this.user }
            });
            
            window.history.pushState(null, null, '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
            
        } catch (error) {
            alert("Ошибка при выходе");
        }
    }

    async updateUserState(payload) {
        try {
            this.user = payload.user;

            this.isAuthenticated = !(!this.user);
            await this.renderHeader();

        } catch (error) {
            alert("Ошибка в обновлении хедера"); 
        }
    }

    async renderHeader() {
        if (!headerRootElement) {
            return;
        }

        const headerData = {
            user: this.user,
            isAuthenticated: this.isAuthenticated
        };
        
        try {
            const renderedHtml = await Header.render(headerData);
            headerRootElement.innerHTML = renderedHtml;
            
            Header.initEventListeners();

        } catch (error) {
            alert("ошибка отрисовки хедера"); 
        }
    }
}

export default new HeaderStore();