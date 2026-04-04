const { serverPublicOrigin } = require("../config/env");
const { sanitizeProjectId } = require("../repositories/projectRepository");
const { saveMemoryVideo } = require("../services/projectService");

const toPublicUrl = (pathOrUrl) => {
  if (typeof pathOrUrl !== "string" || pathOrUrl.trim().length === 0) {
    return pathOrUrl;
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return new URL(pathOrUrl, serverPublicOrigin).toString();
};

const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Missing video file. Use form-data field name 'video'.",
      });
    }

    const projectId = sanitizeProjectId(req.body.projectId);
    const memoryId = req.body.memoryId ? String(req.body.memoryId).trim() : "";
    const { videoUrl, storedName } = await saveMemoryVideo({
      projectId,
      file: req.file,
    });

    return res.status(200).json({
      ok: true,
      projectId,
      memoryId,
      fileName: storedName,
      mimeType: req.file.mimetype,
      videoUrl: toPublicUrl(videoUrl),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadVideo,
};
