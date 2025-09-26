class ApiHandler {
    constructor() {
        // Всегда используем прямой адрес API сервера
        this.baseURL = 'http://localhost:3001/api';
        this.isAuthenticated = false;
        this.user = null;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка запроса');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async checkAuth() {
        try {
            const data = await this.makeRequest('/auth/check');
            this.isAuthenticated = data.isAuthenticated;
            this.user = data.user || null;
            return data;
        } catch (error) {
            this.isAuthenticated = false;
            this.user = null;
            return { isAuthenticated: false };
        }
    }

    async login(email, password) {
        try {
            const data = await this.makeRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data.success) {
                this.isAuthenticated = true;
                this.user = data.user;
            }

            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async register(email, password, name, age) {
        try {
            const data = await this.makeRequest('/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, name, age })
            });

            if (data.success) {
                this.isAuthenticated = true;
                this.user = data.user;
            }

            return data;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await this.makeRequest('/logout', {
                method: 'POST'
            });

            this.isAuthenticated = false;
            this.user = null;

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCards() {
        try {
            return await this.makeRequest('/cards');
        } catch (error) {
            console.error('Ошибка получения карточек:', error);
            return [];
        }
    }

    async cardAction(cardId, action) {
        try {
            return await this.makeRequest(`/cards/${cardId}/action`, {
                method: 'POST',
                body: JSON.stringify({ action })
            });
        } catch (error) {
            console.error('Ошибка действия с карточкой:', error);
            return { success: false };
        }
    }
}

export default new ApiHandler();