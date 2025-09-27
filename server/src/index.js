const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors({
    origin: 'http://127.0.0.1:8080', // Соответствует адресу клиента
    credentials: true // ВАЖНО! Разрешаем отправку куки
}));

const PORT = 3000;

const sessions = new Map(); 

// Middleware для проверки аутентификации через сессии
const requireAuth = (req, res, next) => {
    const sessionId = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1]
        : null;
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Необходима авторизация' });
    }
    
    const sessionData = sessions.get(sessionId);
    req.user = sessionData; // Передаем данные пользователя в запрос
    req.sessionId = sessionId;
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
app.locals.sessions = sessions;

// ВАЖНО: сначала подключаем роуты аутентификации (без middleware)
app.use('/api', authRouter);
// Затем подключаем защищенные роуты карточек
app.use('/api', cardsRouter);

app.listen(PORT, onStart);

module.exports = app;