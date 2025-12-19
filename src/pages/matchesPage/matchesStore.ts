import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { matches } from './matches';
import MatchesApi from '@/apiHandler/matchesApi';

const UPDATE_INTERVAL = 60 * 1000;

interface ProcessedMatch {
    id: string;
    name: string;
    age: number | null;
    image: string;
    matchId: string;
    userId: string;
    matchedAt: string;
    expiresAt: string | null;
    isNew: boolean;
    isActive: boolean;
    timer?: string;
    isExpired?: boolean;
    userData?: any;
    isPremium?: boolean;
}

class MatchesStore implements Store {
    timerId: NodeJS.Timeout | null;
    matches: ProcessedMatch[];
    private isActive: boolean;

    constructor() {
        this.matches = [];
        dispatcher.register(this);
        this.timerId = null;
        this.isActive = false;
    }

    pause(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isActive = false;
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MATCHES:
                this.isActive = true;
                await this.renderMatches();
                break;

            default:
                break;
        }
    }

    private async renderMatches(): Promise<void> {
        try {
            const contentContainer =
                document.getElementById('content-container');
            if (contentContainer) {
                matches.parent = contentContainer;
            }

            const response = await MatchesApi.getAllMatches();

            const matchesArray = response.matches || [];

            this.matches = matchesArray.map((item) => {
                const match = item.match || ({} as Record<string, unknown>);
                const user = item.user || ({} as Record<string, unknown>);
                const photos = Array.isArray(item.photos) ? item.photos : [];

                const matchIdentifier =
                    (match as { id?: string }).id ||
                    (match as { match_id?: string }).match_id ||
                    (user as { id?: string }).id ||
                    (typeof crypto !== 'undefined' &&
                    'randomUUID' in crypto
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random()
                              .toString(16)
                              .slice(2)}`);

                const userId =
                    (user as { id?: string }).id || `user-${matchIdentifier}`;
                const isPremium = Boolean(
                    (user as { is_premium?: boolean }).is_premium ??
                        (user as { premium_until?: string }).premium_until ??
                        (user as { isPremium?: boolean }).isPremium ??
                        (user as { is_premium_user?: boolean }).is_premium_user ??
                        (item as { is_premium?: boolean }).is_premium ??
                        (match as { is_premium?: boolean }).is_premium
                );

                const matchedAtRaw =
                    (match as { matched_at?: string }).matched_at;
                const matchedAt = matchedAtRaw
                    ? new Date(matchedAtRaw)
                    : new Date();

                const expiresAtRaw =
                    (match as { expires_at?: string | null }).expires_at ??
                    (item as { expires_at?: string | null }).expires_at ??
                    null;

                let expiresAt: string | null = null;
                if (expiresAtRaw) {
                    const expiresAtDate = new Date(expiresAtRaw);
                    if (!Number.isNaN(expiresAtDate.getTime())) {
                        expiresAt = expiresAtDate.toISOString();
                    }
                }

                const photoUrl = photos[0] || '/src/assets/image.png';

                return {
                    id: String(matchIdentifier),
                    userId,
                    name: (user as { name?: string }).name || 'Unknown',
                    age:
                        (user as { birth_date?: string }).birth_date
                            ? this.calculateAge(
                                  (user as { birth_date?: string }).birth_date!
                              )
                            : null,
                    image: photoUrl,
                    matchId: String(matchIdentifier),
                    matchedAt: matchedAt.toISOString(),
                    expiresAt,
                    isNew: this.isMatchNew(matchedAt),
                    isActive:
                        (match as { is_active?: boolean }).is_active !== false,
                    isPremium,
                    userData: {
                        ...user,
                        id: userId,
                        matchId: String(matchIdentifier),
                        images: photos,
                        bio:
                            (user as { bio?: string }).bio ||
                            item.description ||
                            '',
                        is_premium: isPremium,
                        is_matched: true,
                    },
                };
            });

            this.matches.sort((a, b) => {
                const dateA = new Date(a.matchedAt).getTime();
                const dateB = new Date(b.matchedAt).getTime();
                return dateB - dateA;
            });

            this.updateDerivedFields();

            await matches.setMatches(this.matches);

            if (!this.timerId) {
                this.timerId = setInterval(() => {
                    if (!this.isActive) return;
                    this.updateDerivedFields();
                    matches.setMatches(this.matches);
                }, UPDATE_INTERVAL);
            }
        } catch (error) {
            await matches.setMatches([]);
        }
    }

    private calculateAge(birthDate: string): number {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            age--;
        }
        return age;
    }

    private isMatchNew(matchedAt: Date): boolean {
        const now = new Date();
        const hoursSinceMatch =
            (now.getTime() - matchedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceMatch < 1;
    }

    cleanup(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isActive = false;
    }

    private updateDerivedFields(): void {
        if (!this.isActive) return;

        const now = Date.now();

        this.matches = this.matches.map((m) => {
            if (!m.expiresAt) {
                return {
                    ...m,
                    timer: undefined,
                    isExpired: false,
                };
            }

            const expiresAt = new Date(m.expiresAt).getTime();
            const timeLeft = expiresAt - now;

            const isExpired = timeLeft <= 0;

            const formatHoursLeft = (hours: number): string => {
                const abs = Math.abs(hours);
                const mod10 = abs % 10;
                const mod100 = abs % 100;
                const word =
                    mod10 === 1 && mod100 !== 11
                        ? 'час'
                        : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
                          ? 'часа'
                          : 'часов';
                const prefix = hours === 1 ? 'Остался' : 'Осталось';
                return `${prefix} ${hours} ${word}`;
            };

            let timer = 'Время истекло';
            if (!isExpired) {
                const hoursLeft = Math.max(
                    1,
                    Math.floor(timeLeft / (1000 * 60 * 60))
                );
                timer = formatHoursLeft(hoursLeft);
            }

            return {
                ...m,
                timer,
                isExpired,
                isNew: !!m.isNew,
            };
        });
    }
}

export default new MatchesStore();
