const { toFile } = require("openai/uploads");
const { sttModel } = require("../config/env");
const { client, assertOpenAiKey } = require("./openaiClient");

const sanitizeProviderMessage = (rawMessage) => {
  if (typeof rawMessage !== "string") {
    return "STT provider request failed.";
  }

  return rawMessage.replace(/sk-[A-Za-z0-9_-]{16,}/g, "[REDACTED_API_KEY]");
};

const transcribeAudio = async ({ buffer, originalName, mimeType, language }) => {
  assertOpenAiKey();

  const file = await toFile(buffer, originalName || "recording.webm", {
    type: mimeType || "audio/webm"
  });

  let response;
  try {
    response = await client.audio.transcriptions.create({
      file,
      model: sttModel,
      ...(language ? { language } : {})
    });
  } catch (providerError) {
    const providerStatus =
      Number(providerError?.status) ||
      Number(providerError?.statusCode) ||
      502;
    const providerMessage =
      sanitizeProviderMessage(
        providerError?.error?.message || providerError?.message
      ) || "STT provider request failed.";
    const error = new Error(`OpenAI STT error: ${providerMessage}`);
    error.status = providerStatus;
    throw error;
  }

  return (response.text || "").trim();
};

module.exports = {
  transcribeAudio
};
