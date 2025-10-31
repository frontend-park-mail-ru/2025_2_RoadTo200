const path = require('path');
const fs = require('fs');
const photosData = require('../fake_db/photos');

// Вспомогательная функция для получения фотографий пользователя
const getUserPhotos = (userId) => {
    return photosData.photos
        .filter(photo => photo.userId === userId)
        .sort((a, b) => a.order - b.order);
};

// Добавление новых фотографий
const addUserPhotos = (userId, files) => {
    const newPhotos = files.map((file, index) => {
        const existingPhotos = getUserPhotos(userId);
        const newPhoto = {
            id: Date.now() + index,
            userId: parseInt(userId),
            imageUrl: `/uploads/users/${file.filename}`,
            filename: file.filename,
            isPrimary: existingPhotos.length === 0 && index === 0, // Первая фото становится основной если нет других
            order: existingPhotos.length + index + 1,
            createdAt: new Date().toISOString()
        };
        
        photosData.photos.push(newPhoto);
        return newPhoto;
    });
    
    return newPhotos;
};

// Удаление фотографии
const deleteUserPhoto = (photoId) => {
    const photoIndex = photosData.photos.findIndex(photo => photo.id === photoId);
    
    if (photoIndex === -1) {
        return { success: false, error: 'Фотография не найдена' };
    }

    const photo = photosData.photos[photoIndex];
    
    // Удаляем файл с диска
    const filePath = path.join(__dirname, '../uploads/users', photo.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Удаляем из базы данных
    photosData.photos.splice(photoIndex, 1);

    return { success: true, message: 'Фотография удалена' };
};

// Установка основной фотографии
const setPrimaryPhoto = (userId, photoId) => {
    // Сбрасываем все isPrimary для пользователя
    photosData.photos.forEach(photo => {
        if (photo.userId === parseInt(userId)) {
            photo.isPrimary = false;
        }
    });

    // Устанавливаем новую основную фотографию
    const primaryPhoto = photosData.photos.find(photo => 
        photo.id === parseInt(photoId) && photo.userId === parseInt(userId)
    );

    if (!primaryPhoto) {
        return { success: false, error: 'Фотография не найдена' };
    }

    primaryPhoto.isPrimary = true;
    return { success: true, photo: primaryPhoto };
};

module.exports = {
    getUserPhotos,
    addUserPhotos,
    deleteUserPhoto,
    setPrimaryPhoto
};