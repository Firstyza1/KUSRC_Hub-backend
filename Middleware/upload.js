const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // เก็บไฟล์ในโฟลเดอร์ uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'User-' + uniqueSuffix + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่
  }
});

exports.upload = multer({ storage }).single('file');
