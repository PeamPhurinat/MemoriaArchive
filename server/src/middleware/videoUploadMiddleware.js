const multer = require("multer");

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE_BYTES,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("video/")) {
      callback(new Error("Only video files are allowed."));
      return;
    }

    callback(null, true);
  },
});

module.exports = videoUpload;

