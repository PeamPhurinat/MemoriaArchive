import { getAccessToken } from "../lib/supabaseClient";

const parseResponsePayload = async (response) => {
  const rawBody = await response.text();
  if (!rawBody) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    return { rawBody };
  }
};

export const apiFetch = async (url, options = {}) => {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const hasFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!hasFormDataBody && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const payload = await parseResponsePayload(response);
  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.rawBody ||
      `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return payload;
};
