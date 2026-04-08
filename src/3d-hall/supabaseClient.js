import { apiFetch } from "../services/apiClient";

export async function saveLayoutToCloud({ projectId, payload }) {
  const safeProjectId = String(projectId || "").trim();
  if (!safeProjectId) {
    return { ok: false, reason: "missing_project" };
  }

  try {
    await apiFetch(`/api/layouts/${encodeURIComponent(safeProjectId)}`, {
      method: "PUT",
      body: JSON.stringify({ layout: payload })
    });
    return { ok: true };
  } catch (error) {
    console.error("Layout save API error:", error?.message || error);
    return { ok: false, reason: error?.message || "save_failed" };
  }
}

export async function loadLayoutFromCloud({ projectId }) {
  const safeProjectId = String(projectId || "").trim();
  if (!safeProjectId) {
    return { ok: false, payload: null, reason: "missing_project" };
  }

  try {
    const response = await apiFetch(`/api/layouts/${encodeURIComponent(safeProjectId)}`, {
      method: "GET"
    });
    return { ok: true, payload: response?.layout ?? null };
  } catch (error) {
    console.error("Layout load API error:", error?.message || error);
    return { ok: false, payload: null, reason: error?.message || "load_failed" };
  }
}
