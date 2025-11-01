import './src/pages/loginPage/loginStore.js';
import './src/pages/mainPage/mainStore.js';
import './src/pages/registerPage/registerStore.js';
import './src/pages/matchesPage/matchesStore.js';
import './src/pages/profilePage/profileStore.js';
import './src/components/Header/headerStore.js';
import './src/components/Menu/menuStore.js';
import './src/components/AuthBackground/authBackgroundStore.js';
import './src/components/MatchCard/matchCardStore.js';

import { Route, Router} from "./router.js";
import { main } from "./src/pages/mainPage/main.js";
import { login } from "./src/pages/loginPage/login.js";
import { register } from "./src/pages/registerPage/register.js";
import { matches } from "./src/pages/matchesPage/matches.js";
import { profile } from "./src/pages/profilePage/profile.js";


const notFoundComponent = {
    render: () => `
      <div class="page">
        <h1>404</h1>
        <a href="/" Link>← Вернуться на главную</a>
      </div>
    `
};


const routes = [
    new Route('/', main, true),
    new Route('/login', login, false),
    new Route('/register', register, false),
    new Route('*', notFoundComponent, false),
    new Route('/matches', matches, true),
    new Route('/me', profile, true)
];

const router = new Router(routes);

export default router;