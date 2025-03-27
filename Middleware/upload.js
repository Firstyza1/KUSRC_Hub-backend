const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // เก็บไฟล์ในโฟลเดอร์ uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "User-" + uniqueSuffix + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่
  },
});

exports.upload = multer({ storage }).single("file");

const filePdfFilter = (req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("อนุญาตให้ใช้ไฟล์ PDF เท่านั้น"), false);
  }

  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error("ขนาดไฟล์ต้องไม่เกิน 5MB"), false);
  }

  cb(null, true);
};

exports.uploadPDF = multer({
  storage: storage,
  fileFilter: filePdfFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");
