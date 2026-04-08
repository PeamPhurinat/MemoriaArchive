import { apiFetch } from "./apiClient";

const VIDEO_UPLOAD_ENDPOINT =
  process.env.REACT_APP_MEDIA_VIDEO_ENDPOINT || "/api/media/video";
const PHOTO_UPLOAD_ENDPOINT = "/api/media/photo";

const toAbsoluteMediaUrl = (pathOrUrl) => {
  if (typeof pathOrUrl !== "string" || pathOrUrl.trim().length === 0) {
    return pathOrUrl;
  }

  if (/^(https?:|blob:|data:)/i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const host = window?.location?.hostname || "localhost";
  const protocol = window?.location?.protocol || "http:";
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const configuredOrigin = process.env.REACT_APP_MEDIA_ORIGIN;
  const fallbackOrigin = isLocalHost
    ? `${protocol}//${host}:5000`
    : `${protocol}//${host}`;
  const mediaOrigin = configuredOrigin || fallbackOrigin;

  return new URL(pathOrUrl, mediaOrigin).toString();
};

export const uploadMemoryVideo = async ({ projectId, memoryId, videoFile }) => {
  if (!videoFile) {
    throw new Error("Missing video file.");
  }

  const formData = new FormData();
  formData.append("projectId", projectId || "default-project");
  formData.append("memoryId", memoryId || "");
  formData.append("video", videoFile, videoFile.name || "memory-video.mp4");

  const payload = await apiFetch(VIDEO_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  return {
    ...payload,
    videoUrl: toAbsoluteMediaUrl(payload.videoUrl),
  };
};

export const uploadPhoto = async ({ projectId, memoryId, photoFile }) => {
  if (!photoFile) {
    throw new Error("Missing photo file.");
  }

  const formData = new FormData();
  formData.append("projectId", projectId || "default-project");
  formData.append("memoryId", memoryId || "");
  formData.append("photo", photoFile, photoFile.name || "photo.jpg");

  const payload = await apiFetch(PHOTO_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  return {
    ...payload,
    photoUrl: toAbsoluteMediaUrl(payload.photoUrl),
  };
};
