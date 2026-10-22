const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const fileName = `profile-${Date.now()}${extension}`;

    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = allowedTypes.test(file.mimetype);

  if (allowedTypes.test(extension) && mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed."));
  }
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = uploadMiddleware;