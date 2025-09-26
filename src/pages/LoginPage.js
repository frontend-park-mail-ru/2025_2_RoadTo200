import loginTemplate from '../templates/login.hbs';
import apiHandler from '../api.js';

class LoginPage {
    constructor(router) {
        this.router = router;
        this.error = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = loginTemplate({ error: this.error });
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await apiHandler.login(email, password);
            
            if (result.success) {
                this.router.navigateTo('/main');
            } else {
                this.error = result.error;
                this.render();
            }
        });
    }
}

export default LoginPage;