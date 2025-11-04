const path = require('path');
const fs = require('fs');
const photosData = require('../fake_db/photos');

// Вспомогательная функция для получения фотографий пользователя (только не удаленные)
const getUserPhotos = (userId) => {
    return photosData.photos
        .filter(photo => photo.userId === userId && !photo.isDeleted)
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
            isPrimary: existingPhotos.length === 0 && index === 0,
            order: existingPhotos.length + index + 1,
            isDeleted: false, // Добавляем флаг мягкого удаления
            createdAt: new Date().toISOString()
        };
        photosData.photos.push(newPhoto);
        return newPhoto;
    });
    return newPhotos;
};

// Мягкое удаление фотографии
const deleteUserPhoto = (photoId) => {
    const photo = photosData.photos.find(photo => photo.id === photoId);
    
    if (!photo) {
        return { success: false, error: 'Фотография не найдена' };
    }
    
    if (photo.isDeleted) {
        return { success: false, error: 'Фотография уже удалена' };
    }
    
    // Мягкое удаление - просто помечаем как удаленную
    photo.isDeleted = true;
    photo.deletedAt = new Date().toISOString();
    
    console.log('Photo soft-deleted, photoId:', photoId);
    
    // Если это была основная фотография, устанавливаем новую основную
    if (photo.isPrimary) {
        const remainingPhotos = getUserPhotos(photo.userId);
        if (remainingPhotos.length > 0) {
            remainingPhotos[0].isPrimary = true;
            console.log('New primary photo set:', remainingPhotos[0].id);
        }
    }
    
    return { success: true, message: 'Фотография удалена' };
};

// Восстановление удаленной фотографии
const restoreUserPhoto = (photoId) => {
    const photo = photosData.photos.find(photo => photo.id === photoId);
    
    if (!photo) {
        return { success: false, error: 'Фотография не найдена' };
    }
    
    if (!photo.isDeleted) {
        return { success: false, error: 'Фотография не была удалена' };
    }
    
    photo.isDeleted = false;
    photo.deletedAt = null;
    
    console.log('Photo restored, photoId:', photoId);
    
    return { success: true, message: 'Фотография восстановлена' };
};

// Установка основной фотографии
const setPrimaryPhoto = (userId, photoId) => {
    // Сбрасываем все isPrimary для пользователя
    photosData.photos.forEach(photo => {
        if (photo.userId === parseInt(userId) && !photo.isDeleted) {
            photo.isPrimary = false;
        }
    });

    // Устанавливаем новую основную фотографию
    const primaryPhoto = photosData.photos.find(photo => 
        photo.id === parseInt(photoId) && 
        photo.userId === parseInt(userId) &&
        !photo.isDeleted
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
    restoreUserPhoto,
    setPrimaryPhoto
};