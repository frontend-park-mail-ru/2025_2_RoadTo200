import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

import { header } from './header.js'; 

import AuthApi from '../../apiHandler/authApi.js';

class HeaderStore{
    user; 
    isAuthenticated;
    
    headerComponent; 

    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        
        dispatcher.register(this);

        this.headerComponent = header;
    
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_HEADER:
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
        if (!this.headerComponent) {
            return;
        }
        
        if (this.user === null) {
        try {
            const response = await AuthApi.checkAuth();
            this.user = response.user || null;
            this.isAuthenticated = !!this.user;
        } catch (error) {
                this.user = null;
                this.isAuthenticated = false;
            }
        }
        const headerData = {
            user: this.user,
            isAuthenticated: this.isAuthenticated
        };
        
        await this.headerComponent.render(headerData);
    }
}

export default new HeaderStore();