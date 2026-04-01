const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const rootDir = path.resolve(__dirname, "..", "..", "..");
const storageRootDir = path.join(rootDir, "server", "storage");
const projectsRootDir = path.join(storageRootDir, "projects");
const uploadsRootDir = path.join(storageRootDir, "uploads");

module.exports = {
  port: Number(process.env.SERVER_PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  sttModel: process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe",
  chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
  interviewDurationMinutes: Number(process.env.INTERVIEW_DURATION_MINUTES || 10),
  projectsRootDir,
  uploadsRootDir
};
