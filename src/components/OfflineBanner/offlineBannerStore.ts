import { dispatcher } from '../../Dispatcher';
import { Actions, Action, ConnectivityAction } from '../../actions';
import { offlineBanner } from './offlineBanner';
import type { Store } from '../../Dispatcher';

class OfflineBannerStore implements Store {
    private isOnline = navigator.onLine;
    private bannerComponent = offlineBanner;
    private isBannerRendered = false;

    constructor() {
        dispatcher.register(this);
        
        // Устанавливаем слушатели online/offline событий
        this.initConnectivityListeners();
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_OFFLINE_BANNER:
                await this.renderBanner();
                break;

            case Actions.CONNECTIVITY_CHANGED:
                await this.updateConnectivityState(action as ConnectivityAction);
                break;

            default:
                break;
        }
    }

    private initConnectivityListeners(): void {
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

    private async renderBanner(): Promise<void> {
        if (!this.bannerComponent) {
            return;
        }
        
        const bannerData = {
            isOnline: this.isOnline
        };
        
        await this.bannerComponent.render(bannerData);
        this.isBannerRendered = true;
        
        // Если мы онлайн при первом рендере, скрываем баннер
        if (this.isOnline) {
            this.bannerComponent.hide();
        }
    }

    private async updateConnectivityState(action: ConnectivityAction): Promise<void> {
        this.isOnline = action.payload!.isOnline;
        
        if (this.isOnline) {
            this.bannerComponent.hide();
        } else {
            this.bannerComponent.show();
        }
    }
}

export default new OfflineBannerStore();
