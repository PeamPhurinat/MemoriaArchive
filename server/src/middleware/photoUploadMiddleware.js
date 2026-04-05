const multer = require("multer");

const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed."));
      return;
    }
    callback(null, true);
  },
});

module.exports = photoUpload;
