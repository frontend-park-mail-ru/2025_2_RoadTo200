# 2025_2_RoadTo200

Репозиторий команды RoadTo200. Проект: Тиндер (dev)

## Состав

- Матвеев Илья - [mtvvi](https://github.com/mtvvi)
- Микулин Михаил - [mamikulin](https://github.com/mamikulin)
- Егоров Дмитрий - [Revachol](https://github.com/Revachol)
- Гилязетдинов Кирилл - [ender019](https://github.com/ender019)

## [Ссылка на backend](https://github.com/go-park-mail-ru/2025_2_RoadTo200)

# Менторы

- Ярослав Кузьмин (_backend_) - [yarikTri](https://github.com/yarikTri)
- Алик Нигматуллин (_frontend_) - [BigBullas](https://github.com/BigBullas)
- Ченцова Дарья (_UX_)
- Конопкин Евгений (_DBMS_)

## Разработка

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

#### С реальным бекендом (http://217.16.17.116:8080)

```bash
npm run dev
```

Приложение откроется на http://localhost:8001. Все запросы к `/api/*` будут проксироваться на бекенд.

#### С мок-сервером (для тестов)

```bash
npm run dev:mock
```

Запустит одновременно мок-сервер на порту 8080 и фронтенд на порту 8001.

### Сборка для продакшена

```bash
npm run build
```

### Предварительный просмотр собранного приложения

```bash
npm run preview
```

### Линтинг

```bash
npm run lint        # проверка кода
npm run lint:fix    # автоматическое исправление
```

## Конфигурация Vite

Проект использует Vite с настроенным обратным прокси:

- В режиме разработки (`npm run dev`) все запросы к `/api/*` проксируются на `http://217.16.17.116:8080`
- Мок-сервер сохранён для тестирования (`npm run dev:mock`)
- В production запросы идут напрямую на бекенд
