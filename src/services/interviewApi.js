import { apiFetch } from "./apiClient";

const INTERVIEW_ENDPOINT = process.env.REACT_APP_INTERVIEW_ENDPOINT || "/api/interview";

const postJson = async (path, body) => {
  return apiFetch(`${INTERVIEW_ENDPOINT}${path}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
};

export const startInterview = async ({ projectId, userName, durationMinutes }) =>
  postJson("/start", { projectId, userName, durationMinutes });

export const sendInterviewMessage = async ({ sessionId, message }) =>
  postJson("/message", { sessionId, message });

export const finishInterview = async ({ sessionId }) =>
  postJson("/finish", { sessionId });
