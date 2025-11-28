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
    expiresAt: string;
    isNew: boolean;
    isActive: boolean;
    timer?: string;
    isExpired?: boolean;
    userData?: any;
}

class MatchesStore implements Store {
    timerId: NodeJS.Timeout | null;
    matches: ProcessedMatch[];

    constructor() {
        this.matches = [];
        dispatcher.register(this);
        this.timerId = null;
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_MATCHES:
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

                const matchedAtRaw =
                    (match as { matched_at?: string }).matched_at;
                const matchedAt = matchedAtRaw
                    ? new Date(matchedAtRaw)
                    : new Date();
                const expiresAt = new Date(
                    matchedAt.getTime() + 24 * 60 * 60 * 1000
                );

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
                    expiresAt: expiresAt.toISOString(),
                    isNew: this.isMatchNew(matchedAt),
                    isActive:
                        (match as { is_active?: boolean }).is_active !== false,
                    userData: {
                        ...user,
                        id: userId,
                        matchId: String(matchIdentifier),
                        images: photos,
                        bio:
                            (user as { bio?: string }).bio ||
                            item.description ||
                            '',
                    },
                };
            });

            this.updateDerivedFields();

            await matches.setMatches(this.matches);

            if (!this.timerId) {
                this.timerId = setInterval(() => {
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
    }

    private updateDerivedFields(): void {
        const now = Date.now();

        this.matches = this.matches.map((m) => {
            const expiresAt = new Date(m.expiresAt).getTime();
            const timeLeft = expiresAt - now;

            const isExpired = timeLeft <= 0;

            let timer = '00:00';
            if (!isExpired) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor(
                    (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
                );
                timer = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
