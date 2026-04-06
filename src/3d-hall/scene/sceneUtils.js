// Utility helpers for user/project ID normalisation and storage keys.

import { LAYOUT_STORAGE_PREFIX, THEME_STORAGE_KEY } from "./constants.js";

export function normalizeUserId(value) {
  const safeValue = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80);
  return safeValue || "guest";
}

export function normalizeProjectId(value) {
  const safeValue = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80);
  return safeValue || "default-project";
}

export function getLayoutStorageKey(userId, projectId) {
  return `${LAYOUT_STORAGE_PREFIX}:${userId}:${projectId}`;
}

export function getThemeStorageKey(userId, projectId) {
  return `${THEME_STORAGE_KEY}:${userId}:${projectId}`;
}
