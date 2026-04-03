const fs = require("fs/promises");
const express = require("express");
const cors = require("cors");
const sttRoutes = require("./routes/sttRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const {
  clientOrigin,
  projectsRootDir,
  uploadsRootDir,
  sttModel,
  openaiApiKey,
  chatModel,
  interviewDurationMinutes
} = require("./config/env");

const app = express();

const allowedOrigins = clientOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsRootDir));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    sttModel,
    chatModel,
    interviewDurationMinutes,
    keyConfigured: Boolean(openaiApiKey),
    serverTime: new Date().toISOString()
  });
});

app.use("/api/stt", sttRoutes);
app.use("/api/interview", interviewRoutes);

app.use((error, req, res, next) => {
  if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      ok: false,
      error: "Audio file is too large. Max size is 25MB."
    });
  }

  if (error.message === "Only audio files are allowed.") {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }

  const statusCode =
    Number(error.status) ||
    Number(error.statusCode) ||
    500;
  const isProd = process.env.NODE_ENV === "production";
  const fallbackMessage = "Failed to transcribe audio.";
  const detailMessage = error?.message || error?.error?.message || fallbackMessage;
  const message =
    statusCode >= 500
      ? isProd
        ? fallbackMessage
        : detailMessage
      : detailMessage;

  return res.status(statusCode).json({
    ok: false,
    error: message
  });
});

const initializeStorage = async () => {
  await fs.mkdir(projectsRootDir, { recursive: true });
  await fs.mkdir(uploadsRootDir, { recursive: true });
};

module.exports = {
  app,
  initializeStorage
};
