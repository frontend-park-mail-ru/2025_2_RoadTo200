const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:8080', // Соответствует адресу клиента
    credentials: true // ВАЖНО! Разрешаем отправку куки
}));

const PORT = 3000;

// Простое хранилище активных токенов (в реальном приложении - база данных)
const activeTokens = new Set();

// Middleware для проверки аутентификации через куки
const requireAuth = (req, res, next) => {
    const token = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]
        : null;
    
    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ error: 'Необходима авторизация' });
    }
    
    req.userToken = token;
    next();
};

function onStart(){
    console.log(`Server running on port ${PORT}`);
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const cardsRouter = require('./routers/cards');
const authRouter = require('./routers/auth');

// Экспортируем middleware для использования в роутерах
app.locals.requireAuth = requireAuth;
app.locals.activeTokens = activeTokens;

// ВАЖНО: сначала подключаем роуты аутентификации (без middleware)
app.use('/api', authRouter);
// Затем подключаем защищенные роуты карточек
app.use('/api', cardsRouter);

app.listen(PORT, onStart);

module.exports = app;