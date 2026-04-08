const express = require("express");
const videoUpload = require("../middleware/videoUploadMiddleware");
const photoUpload = require("../middleware/photoUploadMiddleware");
const { uploadPhoto, uploadVideo } = require("../controllers/mediaController");

const router = express.Router();

router.post("/video", videoUpload.single("video"), uploadVideo);
router.post("/photo", photoUpload.single("photo"), uploadPhoto);

module.exports = router;

