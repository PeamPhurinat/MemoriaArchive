const { sttModel, serverPublicOrigin } = require("../config/env");
const { sanitizeProjectId } = require("../repositories/projectRepository");
const { saveAudioAndTranscript } = require("../services/projectService");
const { transcribeAudio } = require("../services/sttService");

const toPublicUrl = (pathOrUrl) => {
  if (typeof pathOrUrl !== "string" || pathOrUrl.trim().length === 0) {
    return pathOrUrl;
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return new URL(pathOrUrl, serverPublicOrigin).toString();
};

const createTranscription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        error: "Missing audio file. Use form-data field name 'audio'."
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
    const language = req.body.language ? String(req.body.language).trim() : undefined;

    const transcript = await transcribeAudio({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      language
    });

    const slot = await saveAudioAndTranscript({
      userId: req.user.id,
      projectId,
      file: req.file,
      transcript
    });

    return res.status(200).json({
      ok: true,
      projectId,
      model: sttModel,
      transcript,
      audioUrl: toPublicUrl(slot.audioUrl),
      slot
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTranscription
};
