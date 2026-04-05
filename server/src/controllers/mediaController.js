const { serverPublicOrigin } = require("../config/env");
const { sanitizeProjectId } = require("../repositories/projectRepository");
const { saveMemoryPhoto, saveMemoryVideo } = require("../services/projectService");

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

    const requestedProjectId = String(req.body.projectId || "").trim();
    if (!requestedProjectId) {
      return res.status(400).json({
        ok: false,
        error: "Missing projectId."
      });
    }

    const projectId = sanitizeProjectId(requestedProjectId);
    const memoryId = req.body.memoryId ? String(req.body.memoryId).trim() : "";
    const { videoUrl, storedName } = await saveMemoryVideo({
      userId: req.user.id,
      projectId,
      memoryId,
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

const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Missing photo file. Use form-data field name 'photo'.",
      });
    }

    const requestedProjectId = String(req.body.projectId || "").trim();
    if (!requestedProjectId) {
      return res.status(400).json({ ok: false, error: "Missing projectId." });
    }

    const projectId = sanitizeProjectId(requestedProjectId);
    const memoryId = req.body.memoryId ? String(req.body.memoryId).trim() : "";

    const { photoUrl, storedName } = await saveMemoryPhoto({
      userId: req.user.id,
      projectId,
      memoryId,
      file: req.file,
    });

    return res.status(200).json({
      ok: true,
      projectId,
      memoryId,
      fileName: storedName,
      mimeType: req.file.mimetype,
      photoUrl: toPublicUrl(photoUrl),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadPhoto,
  uploadVideo,
};
