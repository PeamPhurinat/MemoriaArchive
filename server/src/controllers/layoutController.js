const { sanitizeProjectId } = require("../repositories/projectRepository");
const {
  readLayout,
  upsertLayout
} = require("../repositories/layoutRepository");

const getUserLayout = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId);
    const layout = await readLayout(req.user.id, projectId);
    res.status(200).json({
      ok: true,
      layout
    });
  } catch (error) {
    next(error);
  }
};

const putUserLayout = async (req, res, next) => {
  try {
    const projectId = sanitizeProjectId(req.params.projectId || req.body?.projectId);
    const layout = req.body?.layout && typeof req.body.layout === "object"
      ? req.body.layout
      : {};

    const savedLayout = await upsertLayout(req.user.id, projectId, layout);
    res.status(200).json({
      ok: true,
      layout: savedLayout,
      theme: savedLayout.themeKey || "dream",
      components: savedLayout.components || {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserLayout,
  putUserLayout
};
