const express = require("express");
const {
  startInterview,
  sendMessage,
  finishInterview
} = require("../controllers/interviewController");

const router = express.Router();

router.post("/start", startInterview);
router.post("/message", sendMessage);
router.post("/finish", finishInterview);

module.exports = router;
