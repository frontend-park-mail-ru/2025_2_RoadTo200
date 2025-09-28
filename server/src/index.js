const cors = require('cors');
const express = require('express');
const session = require('express-session');

const app = express();
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'], 
    credentials: true
}));

const PORT = 3000;

// Настройка сессий
app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true для HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Middleware для проверки аутентификации через сессии
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Необходима авторизация' });
    }
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

// ВАЖНО: сначала подключаем роуты аутентификации (без middleware)
app.use('/api', authRouter);
// Затем подключаем защищенные роуты карточек
app.use('/api', cardsRouter);

app.listen(PORT, onStart);

module.exports = app;