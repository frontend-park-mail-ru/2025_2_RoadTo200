import Handlebars from 'handlebars';
import { dispatcher } from '../../Dispatcher.js';
import { Actions } from '../../actions.js';

class Home {
    parent;
    selectedActivities = [];

    async getTemplate() {
        return await fetch('./src/pages/homePage/home.hbs').then(res => res.text());
    }

    async render() {
        const templateString = await this.getTemplate();
        const template = Handlebars.compile(templateString);
        
        const activities = [
            { id: 'workout', name: 'Тренировка', icon: './src/assets/ActivityCircleSVG/fluent_run-20-regular.svg' },
            { id: 'fun', name: 'Повеселиться', icon: './src/assets/ActivityCircleSVG/smile.svg' },
            { id: 'party', name: 'Вечеринка', icon: './src/assets/ActivityCircleSVG/hugeicons_party.svg' },
            { id: 'chill', name: 'Чиллаут', icon: './src/assets/ActivityCircleSVG/lucide_tree-palm.svg' },
            { id: 'love', name: 'Любовь', icon: './src/assets/ActivityCircleSVG/bi_arrow-through-heart.svg' },
            { id: 'relax', name: 'Излить душу', icon: './src/assets/ActivityCircleSVG/healthicons_sad-outline.svg' },
            { id: 'yoga', name: 'Йога', icon: './src/assets/ActivityCircleSVG/lotus.svg' },
            { id: 'friendship', name: 'Дружба', icon: './src/assets/ActivityCircleSVG/material-symbols-light_handshake-outline.svg' },
            { id: 'culture', name: 'Культура', icon: './src/assets/ActivityCircleSVG/streamline-plump_theater-mask.svg' },
            { id: 'cinema', name: 'Кино', icon: './src/assets/ActivityCircleSVG/ph_film-reel-light.svg' },
        ];
        
        const html = template({ activities });
        
        if (this.parent) {
            this.parent.innerHTML = html;
            this.attachEventListeners();
        }
        
        return html;
    }

    attachEventListeners() {
        const activityItems = this.parent.querySelectorAll('.home-page__activity-item');
        
        activityItems.forEach(item => {
            item.addEventListener('click', () => {
                const activityId = item.dataset.activityId;
                
                if (item.classList.contains('home-page__activity-item--selected')) {
                    item.classList.remove('home-page__activity-item--selected');
                    this.selectedActivities = this.selectedActivities.filter(id => id !== activityId);
                } else {
                    item.classList.add('home-page__activity-item--selected');
                    this.selectedActivities.push(activityId);
                }
            });
        });
        
        const submitButton = this.parent.querySelector('#submit-activities');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                console.log('Selected activities:', this.selectedActivities);
                
                // Сохраняем в localStorage для использования на странице карточек
                localStorage.setItem('selectedActivities', JSON.stringify(this.selectedActivities));
                
                // Переходим на страницу с карточками
                dispatcher.process({
                    type: Actions.NAVIGATE_TO,
                    payload: { path: '/cards' }
                });
            });
        }
    }
}

export const home = new Home();
