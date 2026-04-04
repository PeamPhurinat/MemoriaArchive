const { randomUUID } = require("crypto");

const sessions = new Map();

const createSession = ({ projectId, userName, durationMinutes, meta = {} }) => {
  const id = `session-${randomUUID()}`;
  const now = Date.now();
  const expiresAt = now + durationMinutes * 60 * 1000;

  const session = {
    id,
    projectId,
    userName,
    status: "active",
    durationMinutes,
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    messages: [],
    result: null,
    ...meta
  };

  sessions.set(id, session);
  return session;
};

const getSession = (sessionId) => sessions.get(sessionId);

const updateSession = (sessionId, updater) => {
  const current = sessions.get(sessionId);
  if (!current) return null;

  const nextValue = updater({ ...current });
  sessions.set(sessionId, nextValue);
  return nextValue;
};

module.exports = {
  createSession,
  getSession,
  updateSession
};
