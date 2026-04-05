const { randomUUID } = require("crypto");
const {
  supabaseAdmin,
  assertSupabaseConfigured
} = require("../services/supabaseAdminClient");

const sanitizeProjectId = (value) => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "");

  if (normalized) return normalized;
  return `project-${randomUUID().slice(0, 8)}`;
};

const createDefaultProjectData = (projectId) => {
  const now = new Date().toISOString();
  return {
    id: projectId,
    title: "New Project",
    coupleNames: "",
    createdAt: now,
    updatedAt: now,
    photos: [],
    memories: [],
    photoSlots: [],
    audioSlots: [],
    textSlots: [],
    roomPayload: null,
    interview: null,
    reviewApprovedAt: null
  };
};

const normalizeProjectData = (projectId, value, dbTimestamps = {}, dbFlags = {}) => {
  const fallback = createDefaultProjectData(projectId);
  const payload = value && typeof value === "object" ? value : {};

  const createdAt =
    String(payload.createdAt || dbTimestamps.createdAt || "").trim() ||
    fallback.createdAt;
  const updatedAt =
    String(payload.updatedAt || dbTimestamps.updatedAt || "").trim() ||
    createdAt;

  return {
    ...fallback,
    ...payload,
    id: projectId,
    title: typeof payload.title === "string" ? payload.title : fallback.title,
    coupleNames: typeof payload.coupleNames === "string" ? payload.coupleNames : "",
    createdAt,
    updatedAt,
    photos: Array.isArray(payload.photos) ? payload.photos : [],
    memories: Array.isArray(payload.memories) ? payload.memories : [],
    photoSlots: Array.isArray(payload.photoSlots) ? payload.photoSlots : [],
    audioSlots: Array.isArray(payload.audioSlots) ? payload.audioSlots : [],
    textSlots: Array.isArray(payload.textSlots) ? payload.textSlots : [],
    roomPayload: payload.roomPayload && typeof payload.roomPayload === "object"
      ? payload.roomPayload
      : null,
    interview: payload.interview && typeof payload.interview === "object"
      ? payload.interview
      : null,
    reviewApprovedAt: payload.reviewApprovedAt || null,
    isShared: typeof dbFlags.isShared === "boolean" ? dbFlags.isShared : Boolean(payload.isShared),
  };
};

const getProjectRow = async (projectId) => {
  assertSupabaseConfigured();

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, title, data, is_shared, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    const wrapped = new Error(`Failed to fetch project: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  return data || null;
};

const assertOwnsProject = (userId, projectRow) => {
  if (!projectRow) return;
  if (String(projectRow.user_id) === String(userId)) return;

  const error = new Error("Project not found.");
  error.status = 404;
  throw error;
};

const persistProjectRecord = async (userId, projectId, projectData, existingRow = null) => {
  assertSupabaseConfigured();

  const now = new Date().toISOString();
  const normalized = normalizeProjectData(projectId, projectData, {
    createdAt: existingRow?.created_at,
    updatedAt: now
  });
  normalized.updatedAt = now;

  if (!existingRow) {
    const record = {
      id: projectId,
      user_id: userId,
      title: normalized.title,
      data: normalized,
      created_at: normalized.createdAt || now,
      updated_at: now
    };

    const { error } = await supabaseAdmin
      .from("projects")
      .insert(record);

    if (error) {
      const wrapped = new Error(`Failed to create project: ${error.message}`);
      wrapped.status = 500;
      throw wrapped;
    }

    return normalized;
  }

  const { error } = await supabaseAdmin
    .from("projects")
    .update({
      title: normalized.title,
      data: normalized,
      updated_at: now
    })
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) {
    const wrapped = new Error(`Failed to update project: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  return normalized;
};

const ensureProject = async (userId, projectId) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const existingRow = await getProjectRow(cleanProjectId);
  assertOwnsProject(userId, existingRow);

  if (existingRow) {
    return normalizeProjectData(cleanProjectId, existingRow.data, {
      createdAt: existingRow.created_at,
      updatedAt: existingRow.updated_at
    }, { isShared: existingRow.is_shared });
  }

  return persistProjectRecord(
    userId,
    cleanProjectId,
    createDefaultProjectData(cleanProjectId),
    null
  );
};

const readProject = async (userId, projectId) => ensureProject(userId, projectId);

const writeProject = async (userId, projectId, projectData) => {
  const cleanProjectId = sanitizeProjectId(projectId || projectData?.id);
  const existingRow = await getProjectRow(cleanProjectId);
  assertOwnsProject(userId, existingRow);
  return persistProjectRecord(userId, cleanProjectId, projectData, existingRow);
};

const listProjects = async (userId) => {
  assertSupabaseConfigured();

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, data, is_shared, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    const wrapped = new Error(`Failed to list projects: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  return (data || []).map((row) =>
    normalizeProjectData(sanitizeProjectId(row.id), row.data, {
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }, { isShared: row.is_shared })
  );
};

const appendAudioSlot = async (userId, projectId, slotData) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const project = await readProject(userId, cleanProjectId);
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

  project.updatedAt = new Date().toISOString();
  project.audioSlots = [...project.audioSlots, slot];

  await writeProject(userId, cleanProjectId, project);

  return slot;
};

const saveInterviewOutcome = async (userId, projectId, outcome) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const project = await readProject(userId, cleanProjectId);
  const now = new Date().toISOString();
  const textSlots = Array.isArray(outcome?.roomPayload?.textSlots)
    ? outcome.roomPayload.textSlots
    : [];

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

  return writeProject(userId, cleanProjectId, project);
};

const setMemoryVideo = async (userId, projectId, memoryId, videoUrl) => {
  if (!memoryId || !videoUrl) return null;

  const cleanProjectId = sanitizeProjectId(projectId);
  const cleanMemoryId = String(memoryId).trim();
  if (!cleanMemoryId) return null;

  const project = await readProject(userId, cleanProjectId);
  const memories = Array.isArray(project.memories) ? [...project.memories] : [];
  const index = memories.findIndex((memory) => String(memory?.id || "") === cleanMemoryId);

  if (index >= 0) {
    const existing = memories[index] || {};
    memories[index] = {
      ...existing,
      id: cleanMemoryId,
      video: videoUrl,
      videoUrl
    };
  } else {
    memories.push({
      id: cleanMemoryId,
      title: `Memory ${memories.length + 1}`,
      description: "",
      video: videoUrl,
      videoUrl
    });
  }

  project.memories = memories;
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, cleanProjectId, project);

  return memories.find((memory) => String(memory.id) === cleanMemoryId) || null;
};

const setMemoryPhoto = async (userId, projectId, memoryId, photoUrl) => {
  if (!memoryId || !photoUrl) return null;

  const cleanProjectId = sanitizeProjectId(projectId);
  const cleanMemoryId = String(memoryId).trim();
  if (!cleanMemoryId) return null;

  const project = await readProject(userId, cleanProjectId);
  const memories = Array.isArray(project.memories) ? [...project.memories] : [];
  const index = memories.findIndex((memory) => String(memory?.id || "") === cleanMemoryId);

  if (index >= 0) {
    memories[index] = { ...memories[index], id: cleanMemoryId, photo: photoUrl };
  } else {
    memories.push({
      id: cleanMemoryId,
      title: `Memory ${memories.length + 1}`,
      description: "",
      photo: photoUrl
    });
  }

  project.memories = memories;
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, cleanProjectId, project);

  return memories.find((memory) => String(memory.id) === cleanMemoryId) || null;
};

const setProjectShared = async (userId, projectId, isShared) => {
  assertSupabaseConfigured();
  const cleanProjectId = sanitizeProjectId(projectId);

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ is_shared: Boolean(isShared) })
    .eq("id", cleanProjectId)
    .eq("user_id", userId)
    .select("id, is_shared")
    .maybeSingle();

  if (error) {
    const wrapped = new Error(`Failed to update share state: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  if (!data) {
    const err = new Error("Project not found.");
    err.status = 404;
    throw err;
  }

  return data;
};

const getPublicProject = async (projectId) => {
  assertSupabaseConfigured();
  const cleanProjectId = sanitizeProjectId(projectId);

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, data, is_shared, created_at, updated_at")
    .eq("id", cleanProjectId)
    .eq("is_shared", true)
    .maybeSingle();

  if (error) {
    const wrapped = new Error(`Failed to fetch project: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  if (!data) return null;

  return {
    ...normalizeProjectData(cleanProjectId, data.data, {
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, { isShared: true }),
    ownerId: data.user_id,
  };
};

const appendProjectPhoto = async (userId, projectId, photoData) => {
  const cleanProjectId = sanitizeProjectId(projectId);
  const project = await readProject(userId, cleanProjectId);
  const photos = Array.isArray(project.photos) ? [...project.photos] : [];

  photos.push({
    id: photoData.id || `photo-${Date.now()}`,
    url: photoData.url,
    name: photoData.name || "photo",
    source: "upload"
  });

  project.photos = photos;
  project.updatedAt = new Date().toISOString();
  await writeProject(userId, cleanProjectId, project);

  return photos[photos.length - 1];
};

module.exports = {
  appendAudioSlot,
  appendProjectPhoto,
  createDefaultProjectData,
  getPublicProject,
  listProjects,
  readProject,
  sanitizeProjectId,
  saveInterviewOutcome,
  setMemoryPhoto,
  setMemoryVideo,
  setProjectShared,
  writeProject
};
