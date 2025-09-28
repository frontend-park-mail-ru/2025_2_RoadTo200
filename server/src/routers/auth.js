const router = require('express').Router();

// Временное хранилище пользователей (в реальном проекте - база данных)
const usersData = {};

router.route('/auth/register').post(function(req, res, next) {
    
    const { email, password, name, age } = req.body;

    if (!email || !password || !name || !age) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    // Проверка существования пользователя
    if (usersData[email]) {
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Простая валидация
    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const ageNum = parseInt(age);
    if (ageNum < 18 || ageNum > 100) {
        return res.status(400).json({ error: 'Возраст должен быть от 18 до 100 лет' });
    }

    // Сохранение пользователя
    const newUser = {
        email,
        password,
        name,
        age: ageNum,
        id: Date.now()
    };
    
    usersData[email] = newUser;

    console.log(`Регистрация пользователя: ${email}`);

    // Создаем сессию сразу после регистрации
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;

    res.status(200).json({ 
        status: 'ok', 
        message: 'Регистрация успешна',
        user: { email: newUser.email, name: newUser.name }
    });
});

router.route('/auth/login').post(function(req, res, next) {
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = usersData[email];
    if (!user || user.password !== password) {
        return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    console.log(`Вход пользователя: ${email}`);

    // Создаем сессию
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.status(200).json({ 
        status: 'ok', 
        message: 'Вход выполнен успешно',
        user: { email: user.email, name: user.name } 
    });
});

// Роут для проверки аутентификации
router.route('/auth/check').get(function(req, res, next) {
    if (req.session.userId) {
        // Находим пользователя по ID из сессии
        const user = Object.values(usersData).find(u => u.id === req.session.userId);
        if (user) {
            return res.status(200).json({ 
                authenticated: true, 
                user: { 
                    email: user.email, 
                    name: user.name,
                    age: user.age 
                } 
            });
        }
    }
    
    res.status(401).json({ authenticated: false });
});

// Роут для выхода
router.route('/auth/logout').post(function(req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.clearCookie('connect.sid'); // Имя куки по умолчанию для express-session
        res.status(200).json({ status: 'ok', message: 'Выход выполнен успешно' });
    });
});

module.exports = router;