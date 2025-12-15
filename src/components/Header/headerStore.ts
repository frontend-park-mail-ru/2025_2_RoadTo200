import { dispatcher } from '../../Dispatcher';
import { Actions, Action } from '../../actions';
import { header } from './header';
import AuthApi from '../../apiHandler/authApi';
import ProfileApi from '../../apiHandler/profileApi';
import type { Store } from '../../Dispatcher';
import { clearUserCaches } from '@/utils/cacheControl';
import notificationApi from '@/apiHandler/notificationApi';

interface User {
    email?: string;
    name?: string;
    photos?: any[];
    is_premium?: boolean;
    super_likes_count?: number;
    [key: string]: unknown;
}

class HeaderStore implements Store {
    private user: User | null = null;
    private isAuthenticated = false;
    private headerComponent = header;
    private isHeaderRendered = false;
    private superLikesRemaining: number | null = null;
    private superLikesTotal: number | null = null;
    private unreadCount: number = 0;

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

            case Actions.LOAD_NOTIFICATIONS:
            case Actions.NOTIFICATION_SOCKET_MESSAGE:
                await this.updateUnreadCount();
                await this.renderHeader();
                break;

            case Actions.MARK_NOTIFICATION_READ:
                if (this.unreadCount > 0) {
                    this.unreadCount--;
                    await this.renderHeader();
                }
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
            this.superLikesRemaining =
                typeof (user as User | null)?.super_likes_count === 'number'
                    ? ((user as User).super_likes_count as number)
                    : null;
            this.superLikesTotal = null;
        } catch (error) {
            this.user = null;
            this.isAuthenticated = false;
            this.superLikesRemaining = null;
            this.superLikesTotal = null;
        }
    }

    private async processLogout(): Promise<void> {
        try {
            await AuthApi.logout();
        } catch (error) {
            // ignore logout API errors, we still need to clear state locally
        } finally {
            await clearUserCaches();

            this.user = null;
            this.isAuthenticated = false;
            this.isHeaderRendered = false;
            this.superLikesRemaining = null;
            this.superLikesTotal = null;

            dispatcher.process({
                type: Actions.AUTH_STATE_UPDATED,
                payload: { user: this.user },
            });

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
            this.superLikesRemaining =
                typeof (this.user as User | null)?.super_likes_count ===
                'number'
                    ? ((this.user as User).super_likes_count as number)
                    : null;
            this.superLikesTotal = null;
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
            await this.refreshUser();
        } else if (this.isAuthenticated) {
            await this.refreshProfileData();
        }

        // Извлекаем URL первой фотографии из массива photos или используем дефолтный аватар
        const userPhoto = (this.user?.photos as Array<{ photo_url: string }> | undefined)?.[0]?.photo_url || '/src/assets/default-avatar.svg';
        const userName = (this.user?.name as string | undefined) || (this.user?.email as string | undefined) || '';
        const { remaining: superLikesRemaining, total: superLikesTotal, isPremium } =
            this.getSuperLikesState();
        this.superLikesRemaining = superLikesRemaining;
        this.superLikesTotal = superLikesTotal;

        const headerData = {
            user: this.user,
            isAuthenticated: this.isAuthenticated,
            userPhoto,
            userName,
            isPremium,
            superLikesRemaining,
            superLikesTotal,
            unreadCount: this.unreadCount || 0,
        };

        // Всегда рендерим header заново, чтобы обработчики событий были актуальными
        await this.headerComponent.render(headerData);
        this.isHeaderRendered = true;
    }

    private async refreshUser(): Promise<void> {
        try {
            const response = await AuthApi.checkAuth();
            this.user = (response.user as User | null) || null;
            this.isAuthenticated = !!this.user;
            this.superLikesRemaining =
                typeof (this.user as User | null)?.super_likes_count ===
                'number'
                    ? ((this.user as User).super_likes_count as number)
                    : null;
            this.superLikesTotal = null;

            if (this.isAuthenticated) {
                await this.refreshProfileData();
            }
        } catch {
            this.user = null;
            this.isAuthenticated = false;
            this.superLikesRemaining = null;
            this.superLikesTotal = null;
        }
    }

    private async refreshProfileData(): Promise<void> {
        try {
            const profile = await ProfileApi.getProfile();
            const profileUser = profile.user || {};

            this.user = {
                ...(this.user || {}),
                ...profileUser,
                photos: profile.photos ?? (this.user as User | null)?.photos,
            };

            if (typeof profileUser.super_likes_count === 'number') {
                this.superLikesRemaining = profileUser.super_likes_count;
            }
            if (typeof profileUser.is_premium === 'boolean') {
                (this.user as User).is_premium = profileUser.is_premium;
            }
            this.superLikesTotal = null;
        } catch {
            // ignore profile refresh errors
        }
    }

    async updateUnreadCount(): Promise<void> {
        try {
            const response = await notificationApi.getNotifications();
            const newCount = response.notifications.filter(n => !n.is_read && n.type !== 'message').length;
            if (this.unreadCount !== newCount) {
                this.unreadCount = newCount;
            }
        } catch (error) {

        }
    }

    getSuperLikesState(): { remaining: number; total: number; isPremium: boolean } {
        const isPremium = Boolean((this.user as User | null)?.is_premium);
        const baseTotal = isPremium ? 15 : 5;
        const remaining =
            this.superLikesRemaining === null
                ? baseTotal
                : Math.max(0, this.superLikesRemaining);
        return { remaining, total: baseTotal, isPremium };
    }

    consumeSuperLike(): number {
        const state = this.getSuperLikesState();
        if (state.remaining > 0) {
            this.superLikesRemaining = state.remaining - 1;
            if (this.user) {
                (this.user as User).super_likes_count = this.superLikesRemaining;
            }
            this.renderHeader();
        }
        return this.superLikesRemaining ?? state.total;
    }
}

export default new HeaderStore();
