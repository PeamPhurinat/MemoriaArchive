import { apiFetch } from "./apiClient";

const STT_ENDPOINT = process.env.REACT_APP_STT_ENDPOINT || "/api/stt";

export const transcribeAudio = async ({ projectId, audioBlob, filename, language }) => {
  const formData = new FormData();
  formData.append("projectId", projectId);
  formData.append("audio", audioBlob, filename || "recording.webm");

  if (language) {
    formData.append("language", language);
  }

  return apiFetch(STT_ENDPOINT, {
    method: "POST",
    body: formData
  });
};
