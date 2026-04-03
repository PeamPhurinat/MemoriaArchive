const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { uploadsRootDir } = require("../config/env");
const { appendAudioSlot, sanitizeProjectId } = require("../repositories/projectRepository");

const getExtension = (originalName, mimeType) => {
  const fromName = path.extname(originalName || "").toLowerCase();
  if (fromName) return fromName;

  if (mimeType === "audio/mpeg") return ".mp3";
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") return ".wav";
  if (mimeType === "audio/mp4") return ".m4a";
  return ".webm";
};

const saveAudioAndTranscript = async ({ projectId, file, transcript }) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const audioDirectory = path.join(uploadsRootDir, cleanProjectId, "audio");
  await fs.mkdir(audioDirectory, { recursive: true });

  const extension = getExtension(file.originalname, file.mimetype);
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const absoluteAudioPath = path.join(audioDirectory, storedName);
  await fs.writeFile(absoluteAudioPath, file.buffer);

  const audioUrl = `/uploads/${cleanProjectId}/audio/${storedName}`;
  const slot = await appendAudioSlot(cleanProjectId, {
    id: `audio-${Date.now()}`,
    title: file.originalname || "Recorded Audio",
    transcript,
    audioUrl,
    visible: true
  });

  return slot;
};

module.exports = {
  saveAudioAndTranscript
};
