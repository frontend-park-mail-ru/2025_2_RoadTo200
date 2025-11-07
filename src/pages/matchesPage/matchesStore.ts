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

            case Actions.RENDER_MATCH_PROFILE:
                break;

            default:
                break;
        }
    }

    private async renderMatches(): Promise<void> {
        try {
            const contentContainer = document.getElementById('content-container');
            if (contentContainer) {
                matches.parent = contentContainer;
            }

            const response = await MatchesApi.getAllMatches() as any;
            
            console.log('Matches API Response:', response);
            
            const matchesArray = response.matches || [];
            
            this.matches = matchesArray.map((item: any) => {
                const match = item.match || {};
                const user = item.user || {};
                const photos = item.photos || [];
                
                const matchedAt = match.matched_at ? new Date(match.matched_at) : new Date();
                const expiresAt = new Date(matchedAt.getTime() + 24 * 60 * 60 * 1000);
                
                const imagesArray = photos
                    .filter((p: any) => p.is_approved)
                    .map((p: any) => p.photo_url);
                
                let photoUrl = '/src/assets/image.png';
                if (imagesArray.length > 0) {
                    photoUrl = imagesArray[0];
                }
                
                console.log(`Match ${user.name}: photos count=${photos.length}, approved=${imagesArray.length}, first photo=${photoUrl}`);
                
                return {
                    id: user.id || match.id,
                    name: user.name || 'Unknown',
                    age: user.birth_date ? this.calculateAge(user.birth_date) : null,
                    image: photoUrl,
                    matchId: String(match.id),
                    matchedAt: matchedAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    isNew: this.isMatchNew(matchedAt),
                    isActive: match.is_active !== false,
                    userData: {
                        ...user,
                        images: imagesArray,
                        bio: user.bio || user.description || ''
                    }
                };
            });

            this.updateDerivedFields();
            
            console.log('Processed matches:', this.matches);
            
            await matches.setMatches(this.matches);

            if (!this.timerId) {
                this.timerId = setInterval(() => {
                    this.updateDerivedFields();
                    matches.setMatches(this.matches);
                }, UPDATE_INTERVAL);
            }

        } catch (error) {
            console.error('Error loading matches:', error);
            await matches.setMatches([]);
        }
    }
    
    private calculateAge(birthDate: string): number {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
    
    private isMatchNew(matchedAt: Date): boolean {
        const now = new Date();
        const hoursSinceMatch = (now.getTime() - matchedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceMatch < 1;
    }

    private updateDerivedFields(): void {
        const now = Date.now();

        this.matches = this.matches.map(m => {
            const expiresAt = new Date(m.expiresAt).getTime();
            const timeLeft = expiresAt - now;

            const isExpired = timeLeft <= 0;

            let timer = '00:00';
            if (!isExpired) {
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                timer = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }

            return {
                ...m,
                timer,
                isExpired,
                isNew: !!m.isNew
            };
        });
    }
}

export default new MatchesStore();

