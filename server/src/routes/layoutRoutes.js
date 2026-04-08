const express = require("express");
const {
  getUserLayout,
  putUserLayout
} = require("../controllers/layoutController");

const router = express.Router();

router.get("/:projectId", getUserLayout);
router.put("/:projectId", putUserLayout);

module.exports = router;
