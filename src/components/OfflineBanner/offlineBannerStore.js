import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

import { offlineBanner } from './offlineBanner.js';

class OfflineBannerStore {
    isOnline;
    
    bannerComponent;
    
    isBannerRendered;

    constructor() {
        this.isOnline = navigator.onLine;
        this.isBannerRendered = false;
        
        dispatcher.register(this);
        
        this.bannerComponent = offlineBanner;
        
        // Устанавливаем слушатели online/offline событий
        this.initConnectivityListeners();
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_OFFLINE_BANNER:
                await this.renderBanner();
                break;

            case Actions.CONNECTIVITY_CHANGED:
                await this.updateConnectivityState(action.payload);
                break;

            default:
                break;
        }
    }

    initConnectivityListeners() {
        window.addEventListener('online', () => {
            console.log('Connection restored');
            this.isOnline = true;
            this.bannerComponent.hide();
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost');
            this.isOnline = false;
            this.bannerComponent.show();
        });
    }

    async renderBanner() {
        if (!this.bannerComponent) {
            return;
        }
        
        const bannerData = {
            isOnline: this.isOnline
        };
        
        await this.bannerComponent.render(bannerData);
        this.isBannerRendered = true;
    }

    async updateConnectivityState(payload) {
        this.isOnline = payload.isOnline;
        
        if (this.isOnline) {
            this.bannerComponent.hide();
        } else {
            this.bannerComponent.show();
        }
    }
}

export default new OfflineBannerStore();
