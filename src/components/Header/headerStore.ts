import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { header } from './header';
import AuthApi from '../../apiHandler/authApi';
import type { Store } from '../../Dispatcher';

interface User {
    email?: string;
    [key: string]: unknown;
}

class HeaderStore implements Store {
    private user: User | null = null;
    private isAuthenticated = false;
    private headerComponent = header;
    private isHeaderRendered = false;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_HEADER:
                await this.renderHeader();
                break;

            case Actions.AUTH_STATE_UPDATED:
                await this.updateUserState(
                    action.payload as { user: User | null }
                );
                break;

            case Actions.REQUEST_LOGOUT:
                await this.processLogout();
                break;

            default:
                break;
        }
    }

    private async processCheckAuth(): Promise<void> {
        try {
            const response = await AuthApi.checkAuth();
            const user = response.user || null;

            this.user = user as User | null;
            this.isAuthenticated = !!user;
        } catch (error) {
            this.user = null;
            this.isAuthenticated = false;
        }
    }

    private async processLogout(): Promise<void> {
        try {
            await AuthApi.logout();

            this.user = null;
            this.isAuthenticated = false;
            this.isHeaderRendered = false;

            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: this.user },
            });

            dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/login' },
            });
        } catch (error) {
            // console.error("Logout error:", error);
            dispatcher.process({
                type: Actions.NAVIGATE_TO,
                payload: { path: '/login' },
            });
        }
    }

    private async updateUserState(payload: {
        user: User | null;
    }): Promise<void> {
        try {
            this.user = payload.user;
            this.isAuthenticated = !!this.user;
            await this.renderHeader();
        } catch (error) {
            // console.error("Error updating user state:", error);
        }
    }

    private async renderHeader(): Promise<void> {
        if (!this.headerComponent) {
            return;
        }

        if (this.user === null) {
            try {
                const response = await AuthApi.checkAuth();
                this.user = (response.user as User | null) || null;
                this.isAuthenticated = !!this.user;
            } catch (error) {
                this.user = null;
                this.isAuthenticated = false;
            }
        }

        const headerData = {
            user: this.user,
            isAuthenticated: this.isAuthenticated,
        };

        // Всегда рендерим header заново, чтобы обработчики событий были актуальными
        await this.headerComponent.render(headerData);
        this.isHeaderRendered = true;
    }
}

export default new HeaderStore();
