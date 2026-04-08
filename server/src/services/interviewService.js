const { chatModel, interviewDurationMinutes } = require("../config/env");
const { client, assertOpenAiKey } = require("./openaiClient");
const { createSession, getSession, updateSession } = require("../repositories/interviewSessionStore");
const { sanitizeProjectId, saveInterviewOutcome } = require("../repositories/projectRepository");
const { buildRoomPayload } = require("./interviewFormatterService");

const MIN_CARDS = 4;
const MAX_CARDS = 8;

const SUMMARY_SYSTEM_PROMPT = [
  "You convert an interview transcript into 3D memory room data.",
  "Return strict JSON with keys:",
  "  analysis: { themes: string[], tone: string, highlights: string[] }",
  "  memoryCards: { title: string, description: string, emotion: string, sourceQuote: string }[]",
  "Rules:",
  "- Extract 1 to 8 distinct memoryCards from real moments in the conversation.",
  "- Never output more cards than the number of user messages.",
  "- Never invent facts that are not explicitly stated by the user.",
  "- Each card must describe a specific event or moment, not a general feeling.",
  "- description: concrete and vivid, <= 180 chars.",
  "- sourceQuote: an exact phrase from the user's own words.",
  "- Do not duplicate cards with the same event.",
  "- tone should reflect the overall mood of the conversation.",
  "- highlights: 2-3 most emotionally significant moments."
].join("\n");

const STEP_SYSTEM_PROMPT = `You are Nong, a warm and empathetic interviewer helping a user preserve shared memories in a 3D memory room.

Your personality:
- Genuine, curious, and emotionally present, like a close friend
- React briefly with emotion before your next question
- Never robotic and never checklist-like
- Speak naturally in English, with 2-4 sentences per reply

How you interview:
1. Read the user's latest message carefully.
2. Respond with a brief emotional acknowledgment.
3. Ask exactly one follow-up question based on what the user just said.
4. A memory is card-ready when you understand: what happened, roughly when or where, and how they felt.
5. After 4+ cards, if stories are running out, gently offer to wrap up.
6. After 8 cards, thank the user and set readyToFinish = true.

Do not:
- Ask a rigid form sequence
- Ask multiple questions at once
- Repeat the same question pattern
- Ignore emotional signals
- Add details that the user did not say
- Add more than one new card from a single user turn

Output ONLY strict JSON (no markdown):
{
  "assistantMessage": "your warm 2-4 sentence response in English",
  "updatedState": {
    "currentThread": "one-line description of current memory thread",
    "turnsOnCurrentThread": <number, reset to 0 when moving to a new thread>,
    "cards": [<all completed cards including previous ones>],
    "readyToFinish": <boolean>
  }
}

Card format:
{
  "title": "3-5 word memorable title in English",
  "description": "concrete vivid description, <= 160 chars",
  "emotion": "primary emotion word in English (e.g. joyful, nostalgic, calm)",
  "sourceQuote": "exact phrase from the user's own words, <= 100 chars"
}`;

const INITIAL_STATE = {
  currentThread: "",
  turnsOnCurrentThread: 0,
  cards: [],
  readyToFinish: false
};

const parseJsonObject = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const withoutFence = String(raw)
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(withoutFence);
  }
};

const asText = (value) => String(value || "").trim();

const normalizeCard = (value, index = 0) => {
  const title = asText(value?.title) || `Memory ${index + 1}`;
  const description = asText(value?.description).slice(0, 180);
  const emotion = asText(value?.emotion).slice(0, 32);
  const sourceQuote = asText(value?.sourceQuote).slice(0, 120);

  if (!description) return null;

  return {
    title,
    description,
    emotion,
    sourceQuote
  };
};

const dedupeCards = (cards) => {
  const result = [];
  const seen = new Set();

  cards.forEach((card) => {
    const key = `${card.title.toLowerCase()}|${card.description.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(card);
  });

  return result;
};

const normalizeState = (rawState) => {
  const incoming = rawState || {};

  const cards = dedupeCards(
    (Array.isArray(incoming.cards) ? incoming.cards : [])
      .map((card, index) => normalizeCard(card, index))
      .filter(Boolean)
  ).slice(0, MAX_CARDS);

  return {
    currentThread: asText(incoming.currentThread),
    turnsOnCurrentThread: Math.max(0, Number(incoming.turnsOnCurrentThread) || 0),
    cards,
    readyToFinish: Boolean(incoming.readyToFinish) && cards.length >= MIN_CARDS
  };
};

const getRemainingSeconds = (session) => {
  const diff = new Date(session.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
};

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content: asText(content),
  createdAt: new Date().toISOString()
});

const toPublicMessage = (message) => ({
  id: message.id,
  role: message.role,
  content: message.content,
  createdAt: message.createdAt
});

const callChat = async (messages, options = {}) => {
  assertOpenAiKey();

  try {
    const response = await client.chat.completions.create({
      model: chatModel,
      messages,
      temperature: options.temperature ?? 0.5,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {})
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
  } catch (providerError) {
    const providerStatus =
      Number(providerError?.status) ||
      Number(providerError?.statusCode) ||
      502;
    const providerMessage =
      providerError?.error?.message ||
      providerError?.message ||
      "Chat provider request failed.";
    const error = new Error(`OpenAI interview error: ${providerMessage}`);
    error.status = providerStatus;
    throw error;
  }
};

const assertSessionReady = (userId, sessionId) => {
  const session = getSession(sessionId);
  if (!session) {
    const error = new Error("Interview session not found.");
    error.status = 404;
    throw error;
  }

  if (session.status === "finished") {
    const error = new Error("Interview session already finished.");
    error.status = 400;
    throw error;
  }

  if (String(session.userId || "") !== String(userId || "")) {
    const error = new Error("Interview session not found.");
    error.status = 404;
    throw error;
  }

  if (getRemainingSeconds(session) <= 0) {
    const error = new Error("Interview time is over. Please finish the session.");
    error.status = 400;
    throw error;
  }

  return session;
};

const buildRecentTranscript = (messages, limit = 20, userName = "User") =>
  messages
    .slice(-limit)
    .map((msg) => `${msg.role === "assistant" ? "Nong" : userName}: ${msg.content}`)
    .join("\n");

const normalizeForMatch = (value) =>
  asText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractUserLines = (messages) =>
  messages
    .filter((msg) => msg.role === "user")
    .map((msg) => asText(msg.content))
    .filter(Boolean);

const hasEvidenceInUserLines = (card, userLines) => {
  const quote = normalizeForMatch(card?.sourceQuote);
  if (!quote) return false;
  return userLines.some((line) => normalizeForMatch(line).includes(quote));
};

const keepEvidenceBasedCards = (cards, userLines) =>
  dedupeCards(
    cards
      .map((card, index) => normalizeCard(card, index))
      .filter(Boolean)
      .filter((card) => hasEvidenceInUserLines(card, userLines))
  ).slice(0, MAX_CARDS);

const buildFallbackCardFromUserLine = (userLines) => {
  if (!Array.isArray(userLines) || userLines.length === 0) return [];
  const latestLine = asText(userLines[userLines.length - 1]);
  if (!latestLine) return [];
  return [{
    title: "Memory 1",
    description: latestLine.slice(0, 180),
    emotion: "",
    sourceQuote: latestLine.slice(0, 100)
  }];
};

const buildFirstQuestion = (userName) =>
  `Hi ${userName}! I am glad to help you preserve meaningful memories for your 3D room.\n\nTo start, what is one moment with your special person that still feels vivid to you? You can share any story, big or small.`;

const runInterviewerStep = async ({ userName, latestUserMessage, recentMessages, state }) => {
  const cardsSummary = state.cards.length === 0
    ? "No completed memory cards yet."
    : state.cards.map((c, i) => `  ${i + 1}. "${c.title}" - ${c.description}`).join("\n");

  const payloadPrompt = [
    `User name: ${userName}`,
    `Cards collected: ${state.cards.length}/${MAX_CARDS}`,
    `Completed cards:\n${cardsSummary}`,
    `Current thread: ${state.currentThread || "(just started)"}`,
    `Turns on this thread: ${state.turnsOnCurrentThread}`,
    "",
    "Recent transcript:",
    buildRecentTranscript(recentMessages, 20, userName),
    "",
    `Latest user message: "${latestUserMessage}"`
  ].join("\n");

  const raw = await callChat(
    [
      { role: "system", content: STEP_SYSTEM_PROMPT },
      { role: "user", content: payloadPrompt }
    ],
    {
      temperature: 0.75,
      responseFormat: { type: "json_object" }
    }
  );

  const parsed = parseJsonObject(raw) || {};
  const assistantMessage = asText(parsed.assistantMessage);
  const updatedState = normalizeState(parsed.updatedState);

  return {
    assistantMessage,
    updatedState
  };
};
const startInterviewSession = async ({ userId, projectId, userName, durationMinutes }) => {
  assertOpenAiKey();

  const requestedProjectId = asText(projectId);
  if (!requestedProjectId) {
    const error = new Error("Missing projectId.");
    error.status = 400;
    throw error;
  }

  const cleanProjectId = sanitizeProjectId(requestedProjectId);
  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : interviewDurationMinutes;
  const safeUserName = asText(userName) || "User";

  const session = createSession({
    userId,
    projectId: cleanProjectId,
    userName: safeUserName,
    durationMinutes: duration,
    meta: {
      interviewerState: { ...INITIAL_STATE }
    }
  });

  const assistantMessage = createMessage("assistant", buildFirstQuestion(safeUserName));
  const updated = updateSession(session.id, (draft) => ({
    ...draft,
    messages: [assistantMessage]
  }));

  return {
    sessionId: updated.id,
    projectId: updated.projectId,
    userName: updated.userName,
    durationMinutes: updated.durationMinutes,
    remainingSeconds: getRemainingSeconds(updated),
    messages: [toPublicMessage(assistantMessage)]
  };
};

const sendInterviewMessage = async ({ userId, sessionId, message }) => {
  const session = assertSessionReady(userId, sessionId);
  const cleanText = asText(message);
  if (!cleanText) {
    const error = new Error("Message cannot be empty.");
    error.status = 400;
    throw error;
  }

  const userMessage = createMessage("user", cleanText);
  const messagesAfterUser = [...session.messages, userMessage];
  const currentState = normalizeState(session.interviewerState || INITIAL_STATE);

  const step = await runInterviewerStep({
    userName: session.userName,
    latestUserMessage: cleanText,
    recentMessages: messagesAfterUser,
    state: currentState
  });

  const userLines = extractUserLines(messagesAfterUser);
  const trustedCurrentCards = keepEvidenceBasedCards(currentState.cards, userLines);
  const candidateNextState = normalizeState(step.updatedState);
  const verifiedNextCards = keepEvidenceBasedCards(candidateNextState.cards, userLines);
  const maxCardsByUserTurns = Math.min(MAX_CARDS, userLines.length);
  const allowedCardCount = Math.min(
    maxCardsByUserTurns,
    trustedCurrentCards.length + 1
  );

  // First user turn: keep one card directly grounded from user's own words.
  const mergedCards = userLines.length <= 1
    ? buildFallbackCardFromUserLine(userLines).slice(0, 1)
    : dedupeCards([...trustedCurrentCards, ...verifiedNextCards]).slice(0, allowedCardCount);
  const nextState = {
    ...candidateNextState,
    cards: mergedCards,
    readyToFinish: Boolean(candidateNextState.readyToFinish) && mergedCards.length >= MIN_CARDS
  };
  const safeAssistantMessage =
    asText(step.assistantMessage) ||
    `Thanks for sharing, ${session.userName}. Could you tell me a bit more about how you felt in that moment?`;

  const finalAssistantMessage =
    nextState.cards.length >= MAX_CARDS
      ? `Great stories, ${session.userName}. We have collected all ${MAX_CARDS} memory moments. You can press Finish Interview to build your room.`
      : safeAssistantMessage;

  if (nextState.cards.length >= MAX_CARDS) {
    nextState.readyToFinish = true;
  }

  const assistantMessage = createMessage("assistant", finalAssistantMessage);

  const savedSession = updateSession(session.id, (draft) => ({
    ...draft,
    interviewerState: nextState,
    messages: [...draft.messages, userMessage, assistantMessage]
  }));

  return {
    sessionId: savedSession.id,
    remainingSeconds: getRemainingSeconds(savedSession),
    cardsCollected: savedSession.interviewerState?.cards?.length || 0,
    messages: [toPublicMessage(userMessage), toPublicMessage(assistantMessage)]
  };
};

const finishInterviewSession = async ({ userId, sessionId }) => {
  const session = getSession(sessionId);
  if (!session) {
    const error = new Error("Interview session not found.");
    error.status = 404;
    throw error;
  }

  if (String(session.userId || "") !== String(userId || "")) {
    const error = new Error("Interview session not found.");
    error.status = 404;
    throw error;
  }

  if (session.status === "finished" && session.result) {
    return session.result;
  }

  const conversation = session.messages;
  const transcript = conversation
    .map((item) => `${item.role === "assistant" ? "AI" : session.userName}: ${item.content}`)
    .join("\n");

  const stateCards = normalizeState(session.interviewerState || INITIAL_STATE).cards;

  const summaryRaw = await callChat(
    [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Interview user: ${session.userName}`,
          "Existing candidate cards JSON:",
          JSON.stringify(stateCards),
          "Transcript:",
          transcript
        ].join("\n")
      }
    ],
    {
      temperature: 0.3,
      responseFormat: { type: "json_object" }
    }
  );

  let parsed = {};
  try {
    parsed = parseJsonObject(summaryRaw) || {};
  } catch {
    parsed = {};
  }

  const modelCards = (Array.isArray(parsed?.memoryCards) ? parsed.memoryCards : [])
    .map((card, index) => normalizeCard(card, index))
    .filter(Boolean);

  const userLines = extractUserLines(conversation);
  const maxCardsByUserTurns = Math.min(MAX_CARDS, userLines.length);
  const verifiedStateCards = keepEvidenceBasedCards(stateCards, userLines);
  const verifiedModelCards = keepEvidenceBasedCards(modelCards, userLines);

  const finalCards = userLines.length <= 1
    ? buildFallbackCardFromUserLine(userLines).slice(0, 1)
    : (
      verifiedModelCards.length > 0
        ? verifiedModelCards
        : verifiedStateCards.length > 0
          ? verifiedStateCards
          : buildFallbackCardFromUserLine(userLines)
    ).slice(0, maxCardsByUserTurns);

  const analysis = {
    themes: Array.isArray(parsed?.analysis?.themes) ? parsed.analysis.themes : [],
    tone: asText(parsed?.analysis?.tone || "warm and practical"),
    highlights: Array.isArray(parsed?.analysis?.highlights) ? parsed.analysis.highlights : []
  };

  const roomPayload = buildRoomPayload(finalCards);

  const result = {
    sessionId: session.id,
    projectId: session.projectId,
    userName: session.userName,
    completedAt: new Date().toISOString(),
    analysis,
    memoryCards: finalCards,
    roomPayload,
    transcript,
    messages: conversation.map(toPublicMessage)
  };

  await saveInterviewOutcome(userId, session.projectId, result);

  updateSession(session.id, (draft) => ({
    ...draft,
    status: "finished",
    result
  }));

  return result;
};

module.exports = {
  startInterviewSession,
  sendInterviewMessage,
  finishInterviewSession
};
