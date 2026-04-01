const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { createTranscription } = require("../controllers/sttController");

const router = express.Router();

router.post("/", upload.single("audio"), createTranscription);

module.exports = router;
