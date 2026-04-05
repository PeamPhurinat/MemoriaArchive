const { sanitizeProjectId, getPublicProject, setProjectShared } = require("../repositories/projectRepository");
const { readPublicLayout } = require("../repositories/layoutRepository");

// GET /api/public/projects/:projectId — no auth required
const getSharedProject = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    const project = await getPublicProject(projectId);

    if (!project) {
      return res.status(404).json({ ok: false, error: "Project not found or not shared." });
    }

    return res.status(200).json({ ok: true, project });
  } catch (error) {
    return next(error);
  }
};

// GET /api/public/layouts/:projectId — no auth required
const getSharedLayout = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    const layout = await readPublicLayout(projectId);

    if (layout === null) {
      return res.status(404).json({ ok: false, error: "Layout not found or project not shared." });
    }

    return res.status(200).json({ ok: true, layout });
  } catch (error) {
    return next(error);
  }
};

// PATCH /api/projects/:projectId/share — auth required (owner only)
const toggleProjectShare = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    const isShared = Boolean(req.body?.isShared);

    const result = await setProjectShared(req.user.id, projectId, isShared);
    return res.status(200).json({ ok: true, projectId: result.id, isShared: result.is_shared });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getSharedProject, getSharedLayout, toggleProjectShare };
