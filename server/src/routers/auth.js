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
    usersData[email] = {
        email,
        password,
        name,
        age: ageNum,
        id: Date.now()
    };

    console.log(usersData);

    console.log(`Регистрация пользователя: ${email}`);

    res.status(200).json({ status: 'ok', message: 'Регистрация успешна' });
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

    // Создаем простой токен
    const token = `user_${user.id}_${Date.now()}`;
    
    // Добавляем токен в активные токены
    const activeTokens = req.app.locals.activeTokens;
    activeTokens.add(token);

    // Устанавливаем куки (без cookie-parser!)
    res.setHeader('Set-Cookie', [
        `authToken=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
        // Max-Age=86400 = 24 часа
    ]);

    res.status(200).json({ 
        status: 'ok', 
        message: 'Вход выполнен успешно',
        user: { email: user.email, name: user.name } 
    });
});

// Роут для проверки аутентификации
router.route('/auth/check').get(function(req, res, next) {
    const token = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]
        : null;
    
    const activeTokens = req.app.locals.activeTokens;
    
    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ authenticated: false });
    }
    
    res.status(200).json({ authenticated: true });
});

// Роут для выхода
router.route('/auth/logout').post(function(req, res, next) {
    const token = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1]
        : null;
    
    const activeTokens = req.app.locals.activeTokens;
    
    if (token) {
        activeTokens.delete(token);
    }
    
    // Удаляем куки
    res.setHeader('Set-Cookie', [
        'authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
    ]);
    
    res.status(200).json({ status: 'ok', message: 'Выход выполнен успешно' });
});

module.exports = router;