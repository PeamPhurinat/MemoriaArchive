const INTERVIEW_ENDPOINT = process.env.REACT_APP_INTERVIEW_ENDPOINT || "/api/interview";

const postJson = async (path, body) => {
  const response = await fetch(`${INTERVIEW_ENDPOINT}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Interview API failed (HTTP ${response.status}).`);
  }

  return payload;
};

export const startInterview = async ({ projectId, userName, durationMinutes }) =>
  postJson("/start", { projectId, userName, durationMinutes });

export const sendInterviewMessage = async ({ sessionId, message }) =>
  postJson("/message", { sessionId, message });

export const finishInterview = async ({ sessionId }) =>
  postJson("/finish", { sessionId });
