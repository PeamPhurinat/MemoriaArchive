const STT_ENDPOINT = process.env.REACT_APP_STT_ENDPOINT || "/api/stt";

export const transcribeAudio = async ({ projectId, audioBlob, filename, language }) => {
  const formData = new FormData();
  formData.append("projectId", projectId);
  formData.append("audio", audioBlob, filename || "recording.webm");

  if (language) {
    formData.append("language", language);
  }

  const response = await fetch(STT_ENDPOINT, {
    method: "POST",
    body: formData
  });

  const rawBody = await response.text();
  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message =
      payload.error ||
      rawBody ||
      `Failed to transcribe audio (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return payload;
};
