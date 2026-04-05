// Public API calls — no auth token required

const fetchPublic = async (url) => {
  const response = await fetch(url, { method: "GET" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (HTTP ${response.status}).`);
  }
  return payload;
};

export const getSharedProject = async (projectId) => {
  const payload = await fetchPublic(`/api/public/projects/${encodeURIComponent(projectId)}`);
  return payload.project || null;
};

export const getSharedLayout = async (projectId) => {
  try {
    const payload = await fetchPublic(`/api/public/layouts/${encodeURIComponent(projectId)}`);
    return payload.layout || null;
  } catch {
    return null;
  }
};
