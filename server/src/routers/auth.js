const router = require('express').Router();

// Временное хранилище пользователей (в реальном проекте - база данных)
const usersData = {};

router.route('/auth/register').post((req, res, next) => {
    
    const { email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
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

    // Проверка совпадения паролей
    if (password !== passwordConfirm) {
        return res.status(400).json({ error: 'Пароли не совпадают' });
    }

    // Сохранение пользователя
    const newUser = {
        email,
        password,
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
        user: { email: newUser.email, name: 'Пользователь' }
    });
});

router.route('/auth/login').post((req, res, next) => {
    
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
        user: { email: user.email, name: 'Пользователь' } 
    });
});

// Роут для проверки аутентификации
router.route('/auth/check').get((req, res, next) => {
    if (req.session.userId) {
        // Находим пользователя по ID из сессии
        const user = Object.values(usersData).find(u => u.id === req.session.userId);
        if (user) {
            return res.status(200).json({ 
                authenticated: true, 
                user: { 
                    email: user.email, 
                    name: 'Пользователь'
                } 
            });
        }
    }
    
    res.status(401).json({ authenticated: false });
});

// Роут для выхода
router.route('/auth/logout').post((req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.clearCookie('connect.sid'); // Имя куки по умолчанию для express-session
        res.status(200).json({ status: 'ok', message: 'Выход выполнен успешно' });
    });
});

module.exports = router;