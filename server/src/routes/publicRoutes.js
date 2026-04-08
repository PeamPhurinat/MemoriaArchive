const express = require("express");
const { getSharedProject, getSharedLayout } = require("../controllers/publicController");

const router = express.Router();

router.get("/projects/:projectId", getSharedProject);
router.get("/layouts/:projectId", getSharedLayout);

module.exports = router;
