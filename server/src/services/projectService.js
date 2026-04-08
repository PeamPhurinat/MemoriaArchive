const { randomUUID } = require("crypto");
const { uploadFile } = require("./storageService");
const {
  appendAudioSlot,
  appendProjectPhoto,
  sanitizeProjectId,
  readProject,
  setMemoryPhoto,
  setMemoryVideo,
  writeProject
} = require("../repositories/projectRepository");

const saveAudioAndTranscript = async ({ userId, projectId, file, transcript }) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const { url: audioUrl, storedName } = await uploadFile({
    userId,
    projectId: cleanProjectId,
    type: "audio",
    file,
  });

  const slot = await appendAudioSlot(userId, cleanProjectId, {
    id: `audio-${Date.now()}-${randomUUID().slice(0, 6)}`,
    title: file.originalname || "Recorded Audio",
    transcript,
    audioUrl,
    visible: true
  });

  return slot;
};

const saveMemoryVideo = async ({ userId, projectId, memoryId, file }) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const { url: videoUrl, storedName } = await uploadFile({
    userId,
    projectId: cleanProjectId,
    type: "video",
    file,
  });

  await setMemoryVideo(userId, cleanProjectId, memoryId, videoUrl);
  return { videoUrl, storedName };
};

const saveMemoryPhoto = async ({ userId, projectId, memoryId, file }) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const { url: photoUrl, storedName } = await uploadFile({
    userId,
    projectId: cleanProjectId,
    type: "photo",
    file,
  });

  if (memoryId === 'hall-profile') {
    const project = await readProject(userId, cleanProjectId);
    project.hallProfilePhoto = photoUrl;
    project.updatedAt = new Date().toISOString();
    await writeProject(userId, cleanProjectId, project);
  } else if (memoryId) {
    await setMemoryPhoto(userId, cleanProjectId, memoryId, photoUrl);
  } else {
    await appendProjectPhoto(userId, cleanProjectId, {
      id: `photo-${Date.now()}-${randomUUID().slice(0, 6)}`,
      url: photoUrl,
      name: file.originalname || "photo",
    });
  }

  return { photoUrl, storedName };
};

module.exports = {
  saveAudioAndTranscript,
  saveMemoryPhoto,
  saveMemoryVideo,
};
