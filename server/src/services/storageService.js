const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const { isSupabaseConfigured, supabaseAdmin } = require("./supabaseAdminClient");
const { uploadsRootDir } = require("../config/env");

const BUCKET = "project-media";

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-msvideo": ".avi",
  "video/x-matroska": ".mkv",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mp4": ".m4a",
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
};

const getExtension = (originalName, mimeType) => {
  const fromName = path.extname(originalName || "").toLowerCase();
  if (fromName) return fromName;
  return EXT_BY_MIME[mimeType] || "";
};

const sanitizeSegment = (value) =>
  String(value || "").replace(/[^a-zA-Z0-9-_]/g, "") || "unknown";

/**
 * Upload a file to Supabase Storage when configured, otherwise save to local
 * filesystem. Returns { url, storedName } where url is the public URL or
 * a relative /uploads path usable by the Express static handler.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.projectId
 * @param {"photo"|"video"|"audio"} opts.type
 * @param {{ buffer: Buffer, originalname: string, mimetype: string }} opts.file
 */
const uploadFile = async ({ userId, projectId, type, file }) => {
  const cleanUserId = sanitizeSegment(userId);
  const cleanProjectId = sanitizeSegment(projectId);
  const ext = getExtension(file.originalname, file.mimetype);
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

  if (isSupabaseConfigured) {
    const storagePath = `${cleanUserId}/${cleanProjectId}/${type}/${storedName}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      const wrapped = new Error(`Storage upload failed: ${error.message}`);
      wrapped.status = 500;
      throw wrapped;
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
    return { url: data.publicUrl, storedName };
  }

  // Fallback: local filesystem (dev without Supabase)
  const dir = path.join(uploadsRootDir, cleanUserId, cleanProjectId, type);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, storedName), file.buffer);
  return {
    url: `/uploads/${cleanUserId}/${cleanProjectId}/${type}/${storedName}`,
    storedName,
  };
};

module.exports = { uploadFile };
