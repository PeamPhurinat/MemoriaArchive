const express = require("express");
const videoUpload = require("../middleware/videoUploadMiddleware");
const { uploadVideo } = require("../controllers/mediaController");

const router = express.Router();

router.post("/video", videoUpload.single("video"), uploadVideo);

module.exports = router;

