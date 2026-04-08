const OpenAI = require("openai");
const { openaiApiKey } = require("../config/env");

const client = new OpenAI({
  apiKey: openaiApiKey
});

const assertOpenAiKey = () => {
  if (!openaiApiKey) {
    const error = new Error(
      "OPENAI_API_KEY is missing. Create .env and set OPENAI_API_KEY, then restart npm run server."
    );
    error.status = 400;
    throw error;
  }
};

module.exports = {
  client,
  assertOpenAiKey
};
