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
    private submitButton: HTMLButtonElement | null = null;
    private fillProfileButton: HTMLButtonElement | null = null;

    async getTemplate(): Promise<string> {
        const response = await fetch('./src/pages/homePage/home.hbs');
        return response.text();
    }

    async render(): Promise<void> {
        const templateString = await this.getTemplate();
        const template = Handlebars.compile(templateString);
        const activities: Activity[] = [
            {
                id: 'workout',
                name: 'Тренировка',
                icon: './src/assets/ActivityCircleSVG/fluent_run-20-regular.svg',
            },
            {
                id: 'fun',
                name: 'Повеселиться',
                icon: './src/assets/ActivityCircleSVG/smile.svg',
            },
            {
                id: 'party',
                name: 'Вечеринка',
                icon: './src/assets/ActivityCircleSVG/hugeicons_party.svg',
            },
            {
                id: 'chill',
                name: 'Чиллаут',
                icon: './src/assets/ActivityCircleSVG/lucide_tree-palm.svg',
            },
            {
                id: 'love',
                name: 'Любовь',
                icon: './src/assets/ActivityCircleSVG/bi_arrow-through-heart.svg',
            },
            {
                id: 'relax',
                name: 'Излить душу',
                icon: './src/assets/ActivityCircleSVG/healthicons_sad-outline.svg',
            },
            {
                id: 'yoga',
                name: 'Йога',
                icon: './src/assets/ActivityCircleSVG/lotus.svg',
            },
            {
                id: 'friendship',
                name: 'Дружба',
                icon: './src/assets/ActivityCircleSVG/material-symbols-light_handshake-outline.svg',
            },
            {
                id: 'culture',
                name: 'Культура',
                icon: './src/assets/ActivityCircleSVG/streamline-plump_theater-mask.svg',
            },
            {
                id: 'cinema',
                name: 'Кино',
                icon: './src/assets/ActivityCircleSVG/ph_film-reel-light.svg',
            },
        ];
        const html = template({ activities });
        if (this.parent) {
            this.parent.innerHTML = html;
            this.attachEventListeners();
            this.restoreCachedSelection();
            this.updateSubmitButtonState();
        }
    }

    setActiveActivities(activities: string[]): void {
        this.selectedActivities = activities;

        const activityIds = [
            'workout',
            'fun',
            'party',
            'chill',
            'love',
            'relax',
            'yoga',
            'friendship',
            'culture',
            'cinema',
        ];

        activityIds.forEach((activityId) => {
            const activityItem = this.parent?.querySelector(
                `[data-activity-id="${activityId}"]`
            );
            if (activityItem) {
                if (activities.includes(activityId)) {
                    activityItem.classList.add(
                        'home-page__activity-item--selected'
                    );
                } else {
                    activityItem.classList.remove(
                        'home-page__activity-item--selected'
                    );
                }
            }
        });

        this.persistSelection();
        this.updateSubmitButtonState();
    }

    private updateActivityOnServer(
        activityId: string,
        isSelected: boolean
    ): void {
        const activityData = { [activityId]: isSelected };
        dispatcher.process({
            type: Actions.UPDATE_ACTIVITY,
            payload: activityData,
        });
    }

    private attachEventListeners(): void {
        if (!this.parent) return;

        const activityItems = this.parent.querySelectorAll(
            '.home-page__activity-item'
        );
        activityItems.forEach((item) => {
            item.addEventListener('click', () => {
                const activityId = (item as HTMLElement).dataset.activityId;
                if (!activityId) return;

                if (
                    item.classList.contains(
                        'home-page__activity-item--selected'
                    )
                ) {
                    item.classList.remove('home-page__activity-item--selected');
                    this.selectedActivities = this.selectedActivities.filter(
                        (id) => id !== activityId
                    );
                    this.updateActivityOnServer(activityId, false);
                } else {
                    item.classList.add('home-page__activity-item--selected');
                    if (!this.selectedActivities.includes(activityId)) {
                        this.selectedActivities.push(activityId);
                    }
                    this.updateActivityOnServer(activityId, true);
                }

                this.persistSelection();
                this.updateSubmitButtonState();
            });
        });

        this.submitButton = this.parent.querySelector(
            '#submit-activities'
        ) as HTMLButtonElement | null;
        if (this.submitButton) {
            this.submitButton.addEventListener('click', () => {
                // console.log('Selected activities:', this.selectedActivities);
                localStorage.setItem(
                    'selectedActivities',
                    JSON.stringify(this.selectedActivities)
                );
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/cards' },
                });
            });
        }

        this.fillProfileButton = this.parent.querySelector(
            '#fill-profile'
        ) as HTMLButtonElement | null;
        if (this.fillProfileButton) {
            this.fillProfileButton.addEventListener('click', () => {
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/me' },
                });
            });
        }
    }

    private persistSelection(): void {
        try {
            localStorage.setItem(
                'selectedActivities',
                JSON.stringify(this.selectedActivities)
            );
        } catch {
            // ignore cache errors
        }
    }

    private restoreCachedSelection(): void {
        try {
            const cached = localStorage.getItem('selectedActivities');
            if (!cached) return;
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
                this.setActiveActivities(parsed.filter(Boolean));
            }
        } catch {
            // ignore cache errors
        }
    }

    private updateSubmitButtonState(): void {
        const submitButton =
            this.submitButton ||
            (this.parent?.querySelector(
                '#submit-activities'
            ) as HTMLButtonElement | null);
        if (!submitButton) return;

        const hasSelection = this.selectedActivities.length > 0;
        submitButton.classList.toggle(
            'home-page__submit-button--hidden',
            !hasSelection
        );
        submitButton.disabled = !hasSelection;
    }
}

export const home = new Home();
