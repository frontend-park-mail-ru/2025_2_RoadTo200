const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = 3001;


const users = [
    { id: 1, email: 'test@test.com', password: '123456', name: 'Иван Иванов', age: 20 }
];

const cards = [
    { id: 1, name: 'Анна', age: 25, image: 'https://picsum.photos/300/240?random=1', description: 'Люблю спорт и все' },
    { id: 2, name: 'Мария', age: 23, image: 'https://picsum.photos/300/240?random=2', description: 'Фотографии мое все' },
    { id: 3, name: 'Ана', age: 20, image: 'https://picsum.photos/300/240?random=3', description: 'Люблю спорт и не спорт' },
    { id: 4, name: 'Маария', age: 21, image: 'https://picsum.photos/300/240?random=4', description: 'Фотографии мое не все' },
    { id: 5, name: 'Анана', age: 19, image: 'https://picsum.photos/300/240?random=5', description: 'Люблю спорт и спирт' },
    { id: 6, name: 'Маррия', age: 26, image: 'https://picsum.photos/300/240?random=6', description: 'Фотографии не мое все' },
];


// Валидация для защиты от XSS
const validateEmail = (email) => {
    const emailRegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegExp.test(email) && !/<script|javascript:|on\w+=/i.test(email);
};

const validateName = (name) => {
    return /^[a-zA-Zа-яА-Я\s]{2,50}$/.test(name);
};

const apiApp = express();

apiApp.use(express.json());
apiApp.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));

apiApp.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 
    }
}));


const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Необходима авторизация' });
    }
};


apiApp.post('/api/register', (req, res) => {
    let { email, password, name, age } = req.body;
    
    // Базовая валидация
    if (!email || !password || !name || !age) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }
    
    // Валидация email
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
    }
    
    // Валидация имени
    if (!validateName(name)) {
        return res.status(400).json({ error: 'Имя может содержать только буквы и пробелы' });
    }
    
    // Нормализация данных
    email = email.toLowerCase();
    
    // Проверка возраста
    age = parseInt(age);
    if (isNaN(age) || age < 18 || age > 100) {
        return res.status(400).json({ error: 'Возраст должен быть от 18 до 100 лет' });
    }
    
    // Проверка на существующего пользователя
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    
   
    const newUser = {
        id: users.length + 1,
        email,
        password,
        name,
        age: parseInt(age)
    };
    
    users.push(newUser);
    
    
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    
    res.json({ 
        success: true, 
        user: { id: newUser.id, email: newUser.email, name: newUser.name, age: newUser.age }
    });
});

// Авторизация
apiApp.post('/api/login', (req, res) => {
    let { email, password } = req.body;
    
    // Валидация и санитизация
    if (!email || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
    }
    
    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Некорректный email' });
    }
    
    email = email.toLowerCase();
    
    // Находим пользователя
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(400).json({ error: 'Неверные данные' });
    }
    
    // Создаем сессию
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    
    res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name, age: user.age }
    });
});

// Выход
apiApp.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Проверка авторизации
apiApp.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.userId) {
        const user = users.find(u => u.id === req.session.userId);
        res.json({ 
            isAuthenticated: true, 
            user: { id: user.id, email: user.email, name: user.name, age: user.age }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

// Получение карточек
apiApp.get('/api/cards', requireAuth, (req, res) => {
    res.json(cards);
});

// Лайк/дизлайк
apiApp.post('/api/cards/:id/action', requireAuth, (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'like' или 'dislike'
    
    console.log(`Пользователь ${req.session.userId} поставил ${action} карточке ${id}`);
    
    res.json({ success: true, action, cardId: id });
});

// Запуск API сервера
apiApp.listen(API_PORT, () => {
    console.log(`API сервер запущен на порту ${API_PORT}`);
});

// Статический сервер для фронтенда
app.use(express.static('dist'));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Фронтенд сервер запущен на порту ${PORT}`);
});