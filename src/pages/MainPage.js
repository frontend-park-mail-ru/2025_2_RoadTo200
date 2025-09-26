import mainTemplate from '../templates/main.hbs';
import headerTemplate from '../templates/header.hbs';
import apiHandler from '../api.js';

class MainPage {
    constructor(router) {
        this.router = router;
        this.cards = [];
        this.currentIndex = 0;
    }

    async render() {

        const authCheck = await apiHandler.checkAuth();
        if (!authCheck.isAuthenticated) {
            this.router.navigateTo('/login');
            return;
        }

        try {
            this.cards = await apiHandler.getCards();
        } catch (error) {
            console.error('Ошибка загрузки карточек:', error);
            this.cards = [];
        }

        const currentCard = this.cards[this.currentIndex];
        
        const app = document.getElementById('app');
        app.innerHTML = headerTemplate({ 
            userName: apiHandler.user?.name || 'Пользователь'
        }) + mainTemplate({ 
            hasCards: currentCard !== undefined,
            currentCard: currentCard
        });
        
        this.bindEvents();
    }

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await apiHandler.logout();
                    this.router.navigateTo('/login');
                } catch (error) {
                    console.error('Ошибка выхода:', error);
                }
            });
        }

        const likeBtn = document.getElementById('likeBtn');
        const dislikeBtn = document.getElementById('dislikeBtn');
        
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleCardAction('like'));
        }
        
        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', () => this.handleCardAction('dislike'));
        }
    }

    async handleCardAction(action) {
        const currentCard = this.cards[this.currentIndex];
        if (!currentCard) return;

        try {

            await apiHandler.cardAction(currentCard.id, action);
            

            this.nextCard();
        } catch (error) {
            console.error('Ошибка действия с карточкой:', error);
        }
    }

    nextCard() {
        this.currentIndex++;
        
        if (this.currentIndex >= this.cards.length) {

            const app = document.getElementById('app');
            app.innerHTML = headerTemplate({ 
                userName: apiHandler.user?.name || 'Пользователь'
            }) + mainTemplate({ 
                hasCards: false
            });
            this.bindEvents();
        } else {
            this.render();
        }
    }
}

export default MainPage;