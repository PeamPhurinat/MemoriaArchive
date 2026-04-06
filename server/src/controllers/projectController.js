const {
  createDefaultProjectData,
  deleteProject,
  listProjects,
  readProject,
  sanitizeProjectId,
  writeProject
} = require("../repositories/projectRepository");

const listUserProjects = async (req, res, next) => {
  try {
    const projects = await listProjects(req.user.id);
    res.status(200).json({
      ok: true,
      projects
    });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    const project = await readProject(req.user.id, projectId);
    res.status(200).json({
      ok: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const incoming = req.body?.project && typeof req.body.project === "object"
      ? req.body.project
      : {};
    const requestedId = incoming.id || req.body?.projectId;
    const projectId = sanitizeProjectId(requestedId);

    const seed = {
      ...createDefaultProjectData(projectId),
      ...incoming,
      id: projectId,
      createdAt: incoming.createdAt || new Date().toISOString()
    };

    const project = await writeProject(req.user.id, projectId, seed);

    res.status(201).json({
      ok: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

const upsertProject = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId || req.body?.project?.id);
    const incoming = req.body?.project && typeof req.body.project === "object"
      ? req.body.project
      : {};
    const payload = {
      ...incoming,
      id: projectId,
      updatedAt: new Date().toISOString()
    };

    const project = await writeProject(req.user.id, projectId, payload);

    res.status(200).json({
      ok: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserProject = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    await deleteProject(req.user.id, projectId);
    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  deleteUserProject,
  getProject,
  listUserProjects,
  upsertProject
};
