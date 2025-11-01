const cors = require('cors');
const express = require('express');
const session = require('express-session');
const path = require('path'); // Добавьте эту строку

const app = express();
app.use(cors({
    origin: ['http://localhost:8001', 'http://127.0.0.1:8001'], 
    credentials: true
}));

const PORT = 8080;


app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const cardsRouter = require('./routers/cards');
const authRouter = require('./routers/auth');
const matchesRouter = require('./routers/matches');
const profileRouter = require('./routers/profile');

// Экспортируем middleware для использования в роутерах
app.locals.requireAuth = requireAuth;

// ВАЖНО: сначала подключаем роуты аутентификации (без middleware)
app.use('/api', authRouter);
// Затем подключаем защищенные роуты карточек
app.use('/api', cardsRouter);
// Подключаем роуты мэтчей
app.use('/api/matches', matchesRouter);
// Подключаем роуты профилей
app.use('/api/profile', profileRouter);

app.listen(PORT, onStart);

module.exports = app;