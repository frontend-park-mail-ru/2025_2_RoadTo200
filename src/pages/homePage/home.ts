import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

interface Activity {
    id: string;
    name: string;
    icon: string;
}

export class Home {
    parent: HTMLElement | null = null;
    selectedActivities: string[] = [];

    async getTemplate(): Promise<string> {
        const response = await fetch('./src/pages/homePage/home.hbs');
        return response.text();
    }

    async render(): Promise<void> {
        const templateString = await this.getTemplate();
        const template = Handlebars.compile(templateString);
        const activities: Activity[] = [
            { id: 'workout',    name: 'Тренировка', icon: './src/assets/ActivityCircleSVG/fluent_run-20-regular.svg' },
            { id: 'fun',        name: 'Повеселиться', icon: './src/assets/ActivityCircleSVG/smile.svg' },
            { id: 'party',      name: 'Вечеринка', icon: './src/assets/ActivityCircleSVG/hugeicons_party.svg' },
            { id: 'chill',      name: 'Чиллаут', icon: './src/assets/ActivityCircleSVG/lucide_tree-palm.svg' },
            { id: 'love',       name: 'Любовь', icon: './src/assets/ActivityCircleSVG/bi_arrow-through-heart.svg' },
            { id: 'relax',      name: 'Излить душу', icon: './src/assets/ActivityCircleSVG/healthicons_sad-outline.svg' },
            { id: 'yoga',       name: 'Йога', icon: './src/assets/ActivityCircleSVG/lotus.svg' },
            { id: 'friendship', name: 'Дружба', icon: './src/assets/ActivityCircleSVG/material-symbols-light_handshake-outline.svg' },
            { id: 'culture',    name: 'Культура', icon: './src/assets/ActivityCircleSVG/streamline-plump_theater-mask.svg' },
            { id: 'cinema',     name: 'Кино', icon: './src/assets/ActivityCircleSVG/ph_film-reel-light.svg' },
        ];
        const html = template({ activities });
        if (this.parent) {
            this.parent.innerHTML = html;
            this.attachEventListeners();
        }
    }

    setActiveActivities(activities: string[]): void {
        this.selectedActivities = activities;
        
        const activityIds = ['workout', 'fun', 'party', 'chill', 'love', 'relax', 'yoga', 'friendship', 'culture', 'cinema'];
        
        activityIds.forEach(activityId => {
            const activityItem = this.parent?.querySelector(`[data-activity-id="${activityId}"]`);
            if (activityItem) {
                if (activities.includes(activityId)) {
                    activityItem.classList.add('home-page__activity-item--selected');
                } else {
                    activityItem.classList.remove('home-page__activity-item--selected');
                }
            }
        });
    }

    private updateActivityOnServer(activityId: string, isSelected: boolean): void {
        const activityData = { [activityId]: isSelected };
        dispatcher.process({
            type: Actions.UPDATE_ACTIVITY,
            payload: activityData
        });
    }

    private attachEventListeners(): void {
        if (!this.parent) return;

        const activityItems = this.parent.querySelectorAll('.home-page__activity-item');
        activityItems.forEach(item => {
            item.addEventListener('click', () => {
                const activityId = (item as HTMLElement).dataset.activityId;
                if (!activityId) return;

                if (item.classList.contains('home-page__activity-item--selected')) {
                    item.classList.remove('home-page__activity-item--selected');
                    this.selectedActivities = this.selectedActivities.filter(id => id !== activityId);
                    this.updateActivityOnServer(activityId, false);
                } else {
                    item.classList.add('home-page__activity-item--selected');
                    this.selectedActivities.push(activityId);
                    this.updateActivityOnServer(activityId, true);
                }
            });
        });

        const submitButton = this.parent.querySelector('#submit-activities') as HTMLButtonElement | null;
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                console.log('Selected activities:', this.selectedActivities);
                localStorage.setItem('selectedActivities', JSON.stringify(this.selectedActivities));
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/cards' }
                });
            });
        }
    }
}

export const home = new Home();