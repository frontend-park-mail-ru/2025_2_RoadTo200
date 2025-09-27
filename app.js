import { Route, Router} from "./router.js";
import mainPage from "./src/pages/mainPage/main.js"


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
  new Route('/', mainPage),
  new Route('*', notFoundComponent)
];

const router = new Router(routes);

export default router;