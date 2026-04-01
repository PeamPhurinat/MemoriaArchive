const { toFile } = require("openai/uploads");
const { sttModel } = require("../config/env");
const { client, assertOpenAiKey } = require("./openaiClient");

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
      providerError?.error?.message ||
      providerError?.message ||
      "STT provider request failed.";
    const error = new Error(`OpenAI STT error: ${providerMessage}`);
    error.status = providerStatus;
    throw error;
  }

  return (response.text || "").trim();
};

module.exports = {
  transcribeAudio
};
