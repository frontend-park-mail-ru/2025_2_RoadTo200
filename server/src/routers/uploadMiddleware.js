const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для локального хранения
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/users');
    // Создаем директорию если не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'user-' + (req.body.userId || 'unknown') + '-photo-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'), false);
    }
  }
});

// Middleware для загрузки нескольких файлов
const uploadPhotos = upload.array('photos', 10); // максимум 10 файлов

// Middleware для загрузки одного файла
const uploadSinglePhoto = upload.single('photo');

module.exports = {
  uploadPhotos,
  uploadSinglePhoto
};