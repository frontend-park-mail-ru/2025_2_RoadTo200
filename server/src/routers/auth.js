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

    // Создаем сессию
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Сохраняем данные сессии
    const sessions = req.app.locals.sessions;
    sessions.set(sessionId, {
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date()
    });

    // Устанавливаем куки с sessionId
    res.setHeader('Set-Cookie', [
        `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`
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
    const sessionId = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1]
        : null;
    
    const sessions = req.app.locals.sessions;
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ authenticated: false });
    }
    
    const sessionData = sessions.get(sessionId);
    res.status(200).json({ 
        authenticated: true,
        user: {
            email: sessionData.email,
            name: sessionData.name
        }
    });
});

// Роут для выхода
router.route('/auth/logout').post(function(req, res, next) {
    const sessionId = req.headers.cookie 
        ? req.headers.cookie.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1]
        : null;
    
    const sessions = req.app.locals.sessions;
    
    if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId); // Удаляем сессию
        console.log(`Сессия ${sessionId} удалена`);
    }
    
    // Удаляем куки (включая старые)
    res.setHeader('Set-Cookie', [
        'sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax' // Удаляем старые токен-куки
    ]);
    
    res.status(200).json({ status: 'ok', message: 'Выход выполнен успешно' });
});

module.exports = router;