const router = require('express').Router();
const usersData = require('../fake_db/users');
const { getUserPhotos, addUserPhotos, deleteUserPhoto, setPrimaryPhoto } = require('./photoController');
const { uploadPhotos } = require('./uploadMiddleware');

const applyAuth = (req, res, next) => {
    const {requireAuth} = req.app.locals;
    if (requireAuth) {
        requireAuth(req, res, next);
    } else {
        next();
    }
};

const getFullImageUrl = (imagePath) => {
    const baseUrl = `http://localhost:8080`;
    return `${baseUrl}${imagePath}`;
};

const convertPhotosToFullUrls = (photos) => {
    return photos.map(photo => ({
        ...photo,
        imageUrl: getFullImageUrl(photo.imageUrl)
    }));
};

router.route('/profile').get(applyAuth, (req, res, next) => {

    try {
        const userId = req.session.userId;
        const user = usersData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const userPhotos = getUserPhotos(userId);
        const userPhotosWithUrls = convertPhotosToFullUrls(userPhotos);

        const profile = {
            id: user.id,
            email: user.email,
            name: user.name,
            age: user.age,
            description: user.description,
            quote: user.quote,
            musician: user.musician,
            photos: userPhotosWithUrls,
            primaryPhoto: userPhotosWithUrls.find(photo => photo.isPrimary) || null
        };

        res.status(200).json({
            status: 'ok',
            profile: profile
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении профиля' });
    }
});

router.route('/changeProfile').post(applyAuth, uploadPhotos, (req, res, next) => {
    console.log('changeProfile called');
    console.log('req.body:', req.body);
    console.log('action:', req.body.action);
    console.log('photoId:', req.body.photoId);
    try {
        const userId = req.session.userId;
        const user = usersData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const { 
            action, 
            name, 
            age, 
            description, 
            quote, 
            musician,
            photoId,
            oldPassword,
            newPassword
        } = req.body;

        let result = {};

        switch (action) {
            case 'updateInfo':
                result = updateUserInfo(user, { name, age, description, quote, musician });
                break;

            case 'uploadPhotos':
                if (!req.files || req.files.length === 0) {
                    return res.status(400).json({ error: 'Нет файлов для загрузки' });
                }
                result = handlePhotoUpload(userId, req.files);
                break;

            case 'deletePhoto':
                if (!photoId) {
                    return res.status(400).json({ error: 'photoId обязателен для удаления' });
                }
                result = deleteUserPhoto(parseInt(photoId, 10));
                break;

            case 'setPrimaryPhoto':
                if (!photoId) {
                    return res.status(400).json({ error: 'photoId обязателен для установки основной фото' });
                }
                result = setPrimaryPhoto(userId, parseInt(photoId, 10));
                break;

            case 'changePassword':
                if (!oldPassword || !newPassword) {
                    return res.status(400).json({ error: 'Необходимо указать старый и новый пароль' });
                }
                result = changePassword(user, oldPassword, newPassword);
                if (!result.success) {
                    return res.status(400).json({ error: result.error });
                }
                break;

            case 'deleteAccount':
                result = deleteAccount(userId);
                if (result.success) {
                    req.session.destroy();
                    return res.status(200).json({ status: 'ok', message: 'Аккаунт удален' });
                }
                break;

            default:
                return res.status(400).json({ error: 'Неизвестное действие' });
        }

        if (!result.success && result.error) {
            return res.status(400).json({ error: result.error });
        }

        const updatedUser = usersData.users.find(u => u.id === userId);
        const userPhotos = getUserPhotos(userId);
        const userPhotosWithUrls = convertPhotosToFullUrls(userPhotos);

        const updatedProfile = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            age: updatedUser.age,
            description: updatedUser.description,
            quote: updatedUser.quote,
            musician: updatedUser.musician,
            photos: userPhotosWithUrls,
            primaryPhoto: userPhotosWithUrls.find(photo => photo.isPrimary) || null
        };

        res.status(200).json({
            status: 'ok',
            message: result.message || 'Операция выполнена успешно',
            profile: updatedProfile,
            data: result.data || null
        });

    } catch (error) {
        console.error('Error in changeProfile:', error);
        res.status(500).json({ error: 'Ошибка при изменении профиля' });
    }
});

function updateUserInfo(user, updates) {
    const { name, age, description, quote, musician } = updates;

    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (description !== undefined) user.description = description;
    if (quote !== undefined) user.quote = quote;
    if (musician !== undefined) user.musician = musician;

    return {
        success: true,
        message: 'Информация профиля обновлена'
    };
}

function handlePhotoUpload(userId, files) {
    const newPhotos = addUserPhotos(userId, files);
    const newPhotosWithUrls = convertPhotosToFullUrls(newPhotos);

    return {
        success: true,
        message: 'Фотографии успешно загружены',
        data: {
            newPhotos: newPhotosWithUrls
        }
    };
}

function changePassword(user, oldPassword, newPassword) {
    // В реальном приложении здесь должна быть проверка хеша пароля
    if (user.password !== oldPassword) {
        return {
            success: false,
            error: 'Неверный старый пароль'
        };
    }

    if (newPassword.length < 6) {
        return {
            success: false,
            error: 'Пароль должен содержать минимум 6 символов'
        };
    }

    user.password = newPassword;
    return {
        success: true,
        message: 'Пароль успешно изменен'
    };
}

function deleteAccount(userId) {
    const userIndex = usersData.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return {
            success: false,
            error: 'Пользователь не найден'
        };
    }

    usersData.users.splice(userIndex, 1);
    return {
        success: true,
        message: 'Аккаунт успешно удален'
    };
}

module.exports = router;