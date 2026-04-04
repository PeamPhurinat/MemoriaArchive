const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "..", "..", "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const normalizeEnvValue = (rawValue, fallback = "") => {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return fallback;
  }

  const hasWrappingDoubleQuotes =
    trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const hasWrappingSingleQuotes =
    trimmed.startsWith("'") && trimmed.endsWith("'");

  if (hasWrappingDoubleQuotes || hasWrappingSingleQuotes) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const storageRootDir = path.join(rootDir, "server", "storage");
const projectsRootDir = path.join(storageRootDir, "projects");
const uploadsRootDir = path.join(storageRootDir, "uploads");
const port = Number(normalizeEnvValue(process.env.SERVER_PORT, "5000"));

module.exports = {
  port,
  serverPublicOrigin: normalizeEnvValue(
    process.env.SERVER_PUBLIC_ORIGIN,
    `http://localhost:${port}`
  ),
  clientOrigin: normalizeEnvValue(
    process.env.CLIENT_ORIGIN,
    "http://localhost:3000"
  ),
  openaiApiKey: normalizeEnvValue(process.env.OPENAI_API_KEY, ""),
  sttModel: normalizeEnvValue(
    process.env.OPENAI_STT_MODEL,
    "gpt-4o-mini-transcribe"
  ),
  chatModel: normalizeEnvValue(process.env.OPENAI_CHAT_MODEL, "gpt-4o-mini"),
  interviewDurationMinutes: Number(
    normalizeEnvValue(process.env.INTERVIEW_DURATION_MINUTES, "10")
  ),
  projectsRootDir,
  uploadsRootDir
};
