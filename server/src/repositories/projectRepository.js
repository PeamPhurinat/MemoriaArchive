const fs = require("fs/promises");
const path = require("path");
const { projectsRootDir } = require("../config/env");

const sanitizeProjectId = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "");
  return normalized || "default-project";
};

const createDefaultProjectData = (projectId) => {
  const now = new Date().toISOString();
  return {
    id: projectId,
    title: "",
    coupleNames: "",
    createdAt: now,
    updatedAt: now,
    photoSlots: [],
    textSlots: [],
    audioSlots: []
  };
};

const getProjectDirectory = (projectId) =>
  path.join(projectsRootDir, sanitizeProjectId(projectId));

const getProjectFilePath = (projectId) =>
  path.join(getProjectDirectory(projectId), "memory.json");

const ensureProjectFile = async (projectId) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const projectDir = getProjectDirectory(cleanProjectId);
  const projectFilePath = getProjectFilePath(cleanProjectId);

  await fs.mkdir(projectDir, { recursive: true });

  try {
    await fs.access(projectFilePath);
  } catch {
    const defaultData = createDefaultProjectData(cleanProjectId);
    await fs.writeFile(projectFilePath, JSON.stringify(defaultData, null, 2), "utf8");
  }

  return projectFilePath;
};

const readProject = async (projectId) => {
  const projectFilePath = await ensureProjectFile(projectId);
  const raw = await fs.readFile(projectFilePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.audioSlots)) {
    parsed.audioSlots = [];
  }

  return parsed;
};

const writeProject = async (projectId, projectData) => {
  const projectFilePath = await ensureProjectFile(projectId);
  await fs.writeFile(projectFilePath, JSON.stringify(projectData, null, 2), "utf8");
};

const appendAudioSlot = async (projectId, slotData) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const project = await readProject(cleanProjectId);
  const nextOrder = project.audioSlots.length + 1;
  const slot = {
    id: slotData.id,
    title: slotData.title || `Audio ${nextOrder}`,
    transcript: slotData.transcript || "",
    audioUrl: slotData.audioUrl,
    createdAt: slotData.createdAt || new Date().toISOString(),
    visible: slotData.visible ?? true,
    order: slotData.order ?? nextOrder
  };

  project.id = cleanProjectId;
  project.updatedAt = new Date().toISOString();
  project.audioSlots.push(slot);

  await writeProject(cleanProjectId, project);

  return slot;
};

const saveInterviewOutcome = async (projectId, outcome) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const project = await readProject(cleanProjectId);
  const now = new Date().toISOString();
  const textSlots = Array.isArray(outcome?.roomPayload?.textSlots)
    ? outcome.roomPayload.textSlots
    : [];

  project.id = cleanProjectId;
  project.updatedAt = now;
  project.interview = {
    completedAt: now,
    userName: outcome.userName || "",
    analysis: outcome.analysis || {},
    transcript: outcome.transcript || "",
    rawMessages: Array.isArray(outcome.messages) ? outcome.messages : []
  };
  project.textSlots = textSlots;
  project.memories = textSlots.map((slot) => ({
    id: slot.id,
    title: slot.title,
    description: slot.text
  }));
  project.roomPayload = outcome.roomPayload || {
    textSlots: [],
    photoSlots: [],
    audioSlots: [],
    ordering: [],
    visibility: {}
  };

  await writeProject(cleanProjectId, project);

  return project;
};

module.exports = {
  appendAudioSlot,
  sanitizeProjectId,
  saveInterviewOutcome
};
