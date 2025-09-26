import registerTemplate from '../templates/register.hbs';
import apiHandler from '../api.js';

class RegisterPage {
    constructor(router) {
        this.router = router;
        this.error = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = registerTemplate({ error: this.error });
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const age = document.getElementById('age').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const result = await apiHandler.register(email, password, name, age);
            
            if (result.success) {
                this.router.navigateTo('/main');
            } else {
                this.error = result.error;
                this.render();
            }
        });
    }
}

export default RegisterPage;