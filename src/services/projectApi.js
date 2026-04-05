import { apiFetch } from "./apiClient";

const PROJECT_ENDPOINT = process.env.REACT_APP_PROJECT_ENDPOINT || "/api/projects";

export const listProjects = async () => {
  const payload = await apiFetch(PROJECT_ENDPOINT, {
    method: "GET"
  });
  return Array.isArray(payload.projects) ? payload.projects : [];
};

export const getProject = async (projectId) => {
  if (!projectId) {
    throw new Error("Missing project id.");
  }
  const payload = await apiFetch(`${PROJECT_ENDPOINT}/${encodeURIComponent(projectId)}`, {
    method: "GET"
  });
  return payload.project || null;
};

export const createProject = async (project) => {
  const payload = await apiFetch(PROJECT_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ project: project || {} })
  });
  return payload.project || null;
};

export const toggleShare = async (projectId, isShared) => {
  if (!projectId) throw new Error("Missing project id.");
  const payload = await apiFetch(`${PROJECT_ENDPOINT}/${encodeURIComponent(projectId)}/share`, {
    method: "PATCH",
    body: JSON.stringify({ isShared }),
  });
  return payload;
};

export const saveProject = async (project) => {
  if (!project?.id) {
    throw new Error("Missing project id.");
  }

  const payload = await apiFetch(`${PROJECT_ENDPOINT}/${encodeURIComponent(project.id)}`, {
    method: "PUT",
    body: JSON.stringify({ project })
  });
  return payload.project || null;
};
