const express = require("express");
const {
  createProject,
  deleteUserProject,
  getProject,
  listUserProjects,
  upsertProject
} = require("../controllers/projectController");

const router = express.Router();

router.get("/", listUserProjects);
router.post("/", createProject);
router.get("/:projectId", getProject);
router.put("/:projectId", upsertProject);
router.delete("/:projectId", deleteUserProject);

module.exports = router;
