# Рефакторинг роутера и навигации

## Проблемы старой архитектуры

### До рефакторинга:

1. **Router.js нарушал Flux архитектуру**
   - Напрямую манипулировал DOM
   - Сам вызывал `dispatcher.process()` 
   - Смешивал логику навигации и рендеринга
   
2. **NavigationStore был слишком простым**
   - Просто проксировал вызовы обратно в Router
   - Не содержал реальной бизнес-логики
   - Циклическая зависимость: Store → Router → Dispatcher → Store

3. **Дублирование кода**
   - Логика определения маршрутов была размазана
   - Проверка авторизации смешивалась с рендерингом

## Новая архитектура (Flux)

### Принципы:

```
Action → Dispatcher → Store → View
         ↑                      ↓
         └──────────────────────┘
```

### Компоненты:

#### 1. **NavigationStore** (`src/stores/navigationStore.js`)

**Ответственность:**
- Хранит состояние навигации (текущий путь, маршруты)
- Обрабатывает actions: `NAVIGATE_TO`, `LOAD_ROUTE`
- Содержит всю логику роутинга:
  - Проверка авторизации
  - Определение нужных actions для рендеринга
  - Управление видимостью компонентов (header, menu)
  - Обработка динамических маршрутов

**Пример:**
```javascript
// Компонент диспатчит action
dispatcher.process({
    type: Actions.NAVIGATE_TO,
    payload: { path: '/profile' }
});

// NavigationStore обрабатывает его
async handleAction(action) {
    switch (action.type) {
        case Actions.NAVIGATE_TO:
            await this.navigateTo(action.payload);
            break;
    }
}
```

#### 2. **Router** (`router.js`)

**Ответственность:**
- Легкий слой инициализации
- Настраивает DOM структуру
- Связывает компоненты с контейнерами
- Больше НЕ содержит логику роутинга

**Пример:**
```javascript
export class Router {
    constructor(routes, navigationStore) {
        const rootElement = document.getElementById('root');
        navigationStore.init(routes, rootElement);
        // Только инициализация, никакой логики
    }
}
```

#### 3. **Route** (класс)

Перенесен из `router.js` в `navigationStore.js`, так как это модель данных для store.

## Поток навигации

### Старый способ:
```
Component → router.navigateTo() → router.loadRoute() → dispatcher.process()
```
❌ Плохо: Router сам диспатчит actions

### Новый способ:
```
Component → dispatcher.process(NAVIGATE_TO) → NavigationStore.handleAction() 
    → NavigationStore.navigateTo() → dispatcher.process(RENDER_*)
```
✅ Хорошо: Все через Flux цикл

## Примеры использования

### Навигация из компонента:

```javascript
// В любом месте приложения
dispatcher.process({
    type: Actions.NAVIGATE_TO,
    payload: { path: '/matches' }
});
```

### Загрузка маршрута:

```javascript
// При popstate или начальной загрузке
dispatcher.process({
    type: Actions.LOAD_ROUTE,
    payload: { path: window.location.pathname }
});
```

## Actions

Добавлен новый action:

```javascript
LOAD_ROUTE: "LOAD_ROUTE" // Загрузка текущего маршрута из URL
```

## Преимущества новой архитектуры

1. **Соответствие Flux**
   - Все действия идут через dispatcher
   - Store — единственный источник истины
   - Предсказуемый поток данных

2. **Разделение ответственности**
   - Router — только инициализация
   - NavigationStore — вся логика навигации
   - Stores страниц — рендеринг своих компонентов

3. **Тестируемость**
   - Store можно тестировать изолированно
   - Легко мокировать dispatcher

4. **Расширяемость**
   - Легко добавить middleware
   - Можно добавить navigation guards
   - История навигации может быть в store

## Что изменилось в файлах

### `src/stores/navigationStore.js`
- ✅ Добавлена вся логика роутинга из Router
- ✅ Методы: `init()`, `loadRoute()`, `navigateTo()`
- ✅ Обработка actions: `NAVIGATE_TO`, `LOAD_ROUTE`
- ✅ Класс `Route` перемещен сюда

### `router.js`
- ✅ Упрощен до минимума
- ✅ Только инициализация и настройка DOM
- ❌ Удалена вся логика роутинга
- ❌ Удален класс `Route` (перемещен в navigationStore)

### `app.js`
- ✅ Обновлен импорт `Route` из navigationStore
- ✅ Передача navigationStore в Router конструктор

### `src/actions.js`
- ✅ Добавлен `LOAD_ROUTE` action

## Migration Guide

Если у вас есть код, который использовал router напрямую:

### Было:
```javascript
import router from './router.js';
router.navigateTo('/profile');
```

### Стало:
```javascript
import { dispatcher } from './src/Dispatcher.js';
import { Actions } from './src/actions.js';

dispatcher.process({
    type: Actions.NAVIGATE_TO,
    payload: { path: '/profile' }
});
```

## Будущие улучшения

1. **Navigation Guards**
   ```javascript
   navigationStore.beforeEach((to, from) => {
       // Можно отменить навигацию
   });
   ```

2. **История навигации**
   ```javascript
   navigationStore.history = ['/home', '/profile', '/settings'];
   ```

3. **Transition анимации**
   ```javascript
   navigationStore.transitions = {
       '/home': 'fade',
       '/profile': 'slide'
   };
   ```

4. **Lazy loading маршрутов**
   ```javascript
   new Route('/admin', () => import('./admin.js'), true);
   ```

## Заключение

Теперь навигация полностью соответствует Flux архитектуре:
- ✅ Unidirectional data flow
- ✅ Store как single source of truth
- ✅ Все изменения через actions
- ✅ Предсказуемое поведение
- ✅ Легко тестировать и расширять
