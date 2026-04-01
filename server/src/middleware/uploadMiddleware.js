const multer = require("multer");

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_SIZE_BYTES
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("audio/")) {
      callback(new Error("Only audio files are allowed."));
      return;
    }

    callback(null, true);
  }
});

module.exports = upload;
