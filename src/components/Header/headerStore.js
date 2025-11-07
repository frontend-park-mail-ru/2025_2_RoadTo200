import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

import { header } from './header.js'; 

import AuthApi from '../../apiHandler/authApi.js';

class HeaderStore{
    user;
 
    isAuthenticated;
    
    headerComponent;

    isHeaderRendered;

    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.isHeaderRendered = false;
        
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
            this.isAuthenticated = false;
            this.isHeaderRendered = false;

            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: this.user }
            });
            
            dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/login' }
            });
            
        } catch (error) {
            console.error("Logout error:", error);
            // Всё равно редиректим на /login даже если logout запрос упал
            dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/login' }
            });
        }
    }

    async updateUserState(payload) {
        try {
            this.user = payload.user;

            this.isAuthenticated = !(!this.user);
            await this.renderHeader();

        } catch (error) {
            console.error("Error updating user state:", error);
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

        // Рендерим хедер только один раз
        if (!this.isHeaderRendered) {
            const headerData = {
                user: this.user,
                isAuthenticated: this.isAuthenticated
            };
            
            await this.headerComponent.render(headerData);
            this.isHeaderRendered = true;
        } else {
            // Только обновляем состояние без полной перерисовки
            this.headerComponent.updateAuthState(this.isAuthenticated);
        }
    }
}

export default new HeaderStore();