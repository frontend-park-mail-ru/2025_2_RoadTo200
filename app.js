import { Route, Router} from "./router.js";
import mainPage from "./src/pages/mainPage/main.js";
import loginPage from "./src/pages/loginPage/login.js";
import registerPage from "./src/pages/registerPage/register.js";


const notFoundComponent = {
  render: () => {
    return `
      <div class="page">
        <h1>404</h1>
        <a href="/" Link>← Вернуться на главную</a>
      </div>
    `;
  }
};


const routes = [
  new Route('/', mainPage, true), // Главная страница требует аутентификации
  new Route('/login', loginPage, false),
  new Route('/register', registerPage, false),
  new Route('*', notFoundComponent, false)
];

const router = new Router(routes);

export default router;