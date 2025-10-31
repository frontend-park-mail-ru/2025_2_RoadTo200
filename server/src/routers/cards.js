const router = require('express').Router();
const usersData = require('../fake_db/users');
const { getUserPhotos } = require('./photoController');
const { uploadPhotos } = require('./uploadMiddleware');
const { addUserPhotos, deleteUserPhoto, setPrimaryPhoto } = require('./photoController');

// Middleware для применения к конкретным роутам
const applyAuth = (req, res, next) => {
    const {requireAuth} = req.app.locals;
    if (requireAuth) {
        requireAuth(req, res, next);
    } else {
        next();
    }
};

// Функция для преобразования пути в полный URL
const getFullImageUrl = (imagePath) => {
    const baseUrl = process.env.BASE_URL || `http://localhost:8080`;
    return `${baseUrl}${imagePath}`;
};

// Функция для преобразования массива фотографий
const convertPhotosToFullUrls = (photos) => {
    return photos.map(photo => ({
        ...photo,
        imageUrl: getFullImageUrl(photo.imageUrl)
    }));
};

// Роут для загрузки фотографий
router.route('/upload-photos').post(applyAuth, uploadPhotos, (req, res, next) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'ID пользователя обязателен' });
        }

        const user = usersData.users.find(u => u.id === parseInt(userId));
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Нет файлов для загрузки' });
        }

        const newPhotos = addUserPhotos(userId, req.files);

        // Возвращаем фото с полными URL
        const newPhotosWithUrls = convertPhotosToFullUrls(newPhotos);

        res.status(200).json({
            status: 'ok',
            message: 'Фотографии успешно загружены',
            photos: newPhotosWithUrls
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при загрузке фотографий' });
    }
});

// Роут для удаления фотографии
router.route('/delete-photo/:photoId').delete(applyAuth, (req, res, next) => {
    try {
        const photoId = parseInt(req.params.photoId);
        const result = deleteUserPhoto(photoId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.status(200).json({
            status: 'ok',
            message: result.message
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении фотографии' });
    }
});

// Роут для установки основной фотографии
router.route('/set-primary-photo').put(applyAuth, (req, res, next) => {
    try {
        const { userId, photoId } = req.body;
        
        if (!userId || !photoId) {
            return res.status(400).json({ error: 'userId и photoId обязательны' });
        }

        const result = setPrimaryPhoto(userId, photoId);
        
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        // Возвращаем фото с полным URL
        const photoWithUrl = {
            ...result.photo,
            imageUrl: getFullImageUrl(result.photo.imageUrl)
        };

        res.status(200).json({
            status: 'ok',
            message: 'Основная фотография обновлена',
            photo: photoWithUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении основной фотографии' });
    }
});

// Существующие роуты для карточек
router.route('/swipe').post(applyAuth, (req, res, next) => {
    const { card_id, action, timestamp } = req.body;

    if (!card_id || !action) {
        return res.status(400).json({ error: 'card_id или action обязательны' });
    }

    console.log(`Card ID: ${card_id}: Action: ${action}`);

    res.status(200).json({ status: 'ok', message: 'Действие зарегистрировано' });
});

router.route('/feed/:cardId').get(applyAuth, (req, res, next) => {
    const id = parseInt(req.params.cardId);
    const user = usersData.users.find(user => user.id === id);
    
    if(user) {
        const userPhotos = getUserPhotos(user.id);
        const userPhotosWithUrls = convertPhotosToFullUrls(userPhotos);
        
        const card = {
            id: user.id,
            Name: user.name,
            Age: user.age,
            Description: user.description,
            images: userPhotosWithUrls, // массив с полными URL
            photosCount: userPhotosWithUrls.length,
            img1: getFullImageUrl(userPhotos[0]?.imageUrl), // полный URL для первой фото
            img2: getFullImageUrl(userPhotos[1]?.imageUrl), // полный URL для второй фото
            quote: user.quote,
            musician: user.musician
        };
        res.json(card);
    } else  {
        res.status(404).json({ error: 'Пользователь не найден' });
    }
});

router.route('/feed/').get(applyAuth, (req, res, next) => {
    const cards = usersData.users.map(user => {
        const userPhotos = getUserPhotos(user.id);
        const userPhotosWithUrls = convertPhotosToFullUrls(userPhotos);
        
        return {
            id: user.id,
            Name: user.name,
            Age: user.age,
            Description: user.description,
            images: userPhotosWithUrls, // массив с полными URL
            photosCount: userPhotosWithUrls.length,
            img1: getFullImageUrl(userPhotos[0]?.imageUrl), // полный URL
            img2: getFullImageUrl(userPhotos[1]?.imageUrl), // полный URL
            quote: user.quote,
            musician: user.musician
        };
    });
    res.json(cards);
});

module.exports = router;