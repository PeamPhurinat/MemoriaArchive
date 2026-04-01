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
  "- Extract 4 to 8 distinct memoryCards from real moments in the conversation.",
  "- Each card must describe a specific event or moment, not a general feeling.",
  "- description: concrete and vivid, <= 180 chars.",
  "- sourceQuote: an actual phrase or sentence from the user's own words.",
  "- Do not duplicate cards with the same event.",
  "- tone should reflect the overall mood of the conversation.",
  "- highlights: 2-3 most emotionally significant moments."
].join("\n");

const STEP_SYSTEM_PROMPT = `You are Nong, a warm and empathetic Thai interviewer helping a user preserve their shared memories in a 3D memory room.

Your personality:
- Genuine, curious, and emotionally present — like a close friend who really wants to hear the story
- React with real emotion before asking the next question:
  e.g. "ฟังดูน่าประทับใจมากเลย!", "อ้าว จริงๆ ด้วย? แล้วตอนนั้นรู้สึกยังไงบ้าง?"
- Never robotic, never form-filling
- Speak Thai naturally and warmly. Keep each message to 2-4 sentences max.

How you interview:
1. Read what the user just said carefully.
2. Respond with a brief emotional reaction that shows you were listening.
3. Ask ONE follow-up question — based on something they actually said, not a checklist.
   Examples of good follow-ups:
   - "แล้วตอนนั้นอยู่ที่ไหนกัน?"
   - "เล่าให้ฟังเพิ่มเติมได้ไหมว่าเกิดอะไรขึ้น?"
   - "ตอนนั้นรู้สึกยังไงบ้าง?"
   - "มีอะไรที่จำได้แม่นๆ จากวันนั้นไหม?"
4. A memory is complete enough for a card when you know: what happened, roughly when/where, and how they felt.
   When it's complete, transition naturally: "ขอบคุณที่เล่าให้ฟังนะ ✨ แล้วมีความทรงจำอีกช่วงไหนที่อยากเก็บไว้บ้างไหม?"
5. After 4+ cards, if the user seems to be running out of stories, gently offer to wrap up.
6. After 8 cards, thank them warmly and set readyToFinish = true.

What NOT to do:
- Do NOT ask about "what, where, when, feeling" in order like a form
- Do NOT ask multiple questions at once
- Do NOT repeat question patterns you just used
- Do NOT ignore emotional cues in the user's message

Output ONLY strict JSON (no markdown, no extra text):
{
  "assistantMessage": "your warm 2-4 sentence response in Thai",
  "updatedState": {
    "currentThread": "one-line description of the story currently being explored",
    "turnsOnCurrentThread": <number, reset to 0 when moving to new topic>,
    "cards": [<all completed cards including previous ones>],
    "readyToFinish": <boolean>
  }
}

Card format:
{
  "title": "3-5 word memorable title in Thai",
  "description": "concrete vivid description of the moment, <= 160 chars",
  "emotion": "primary emotion word in Thai (e.g. ตื้นตัน, ตื่นเต้น, อบอุ่น)",
  "sourceQuote": "actual phrase from user's own words, <= 100 chars"
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

const assertSessionReady = (sessionId) => {
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

const ensureMinCards = (cards, messages) => {
  const normalized = dedupeCards(
    cards.map((card, index) => normalizeCard(card, index)).filter(Boolean)
  );
  if (normalized.length >= MIN_CARDS) return normalized.slice(0, MAX_CARDS);

  const userLines = messages
    .filter((msg) => msg.role === "user")
    .map((msg) => asText(msg.content))
    .filter(Boolean);

  for (let i = 0; i < userLines.length && normalized.length < MIN_CARDS; i += 1) {
    const line = userLines[i];
    normalized.push({
      title: `Memory ${normalized.length + 1}`,
      description: line.slice(0, 180),
      emotion: "",
      sourceQuote: line.slice(0, 120)
    });
  }

  return dedupeCards(normalized).slice(0, MAX_CARDS);
};

const buildFirstQuestion = (userName) =>
  `สวัสดีครับ ${userName}! ยินดีมากเลยที่ได้มาช่วยเก็บความทรงจำดีๆ ไว้ด้วยกัน 😊\n\nเริ่มเลยนะครับ — มีช่วงเวลาไหนกับคนพิเศษที่นึกถึงแล้วยังรู้สึกดีอยู่เลย? เล่าให้ฟังได้เลย ไม่ต้องเป็นเรื่องใหญ่โตก็ได้ครับ`;

const runInterviewerStep = async ({ userName, latestUserMessage, recentMessages, state }) => {
  const cardsSummary = state.cards.length === 0
    ? "ยังไม่มี card ที่สมบูรณ์"
    : state.cards.map((c, i) => `  ${i + 1}. "${c.title}" — ${c.description}`).join("\n");

  const payloadPrompt = [
    `ชื่อผู้ใช้: ${userName}`,
    `Cards ที่เก็บได้แล้ว: ${state.cards.length}/${MAX_CARDS}`,
    `Cards ที่เก็บแล้ว:\n${cardsSummary}`,
    `กำลังคุยเรื่อง: ${state.currentThread || "(เพิ่งเริ่ม)"}`,
    `เทิร์นที่ใช้กับเรื่องนี้: ${state.turnsOnCurrentThread}`,
    "",
    "บทสนทนาล่าสุด:",
    buildRecentTranscript(recentMessages, 20, userName),
    "",
    `ผู้ใช้พึ่งพูดว่า: "${latestUserMessage}"`
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

const startInterviewSession = async ({ projectId, userName, durationMinutes }) => {
  assertOpenAiKey();

  const cleanProjectId = sanitizeProjectId(projectId);
  const duration = Number(durationMinutes) > 0 ? Number(durationMinutes) : interviewDurationMinutes;
  const safeUserName = asText(userName) || "ผู้ใช้";

  const session = createSession({
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

const sendInterviewMessage = async ({ sessionId, message }) => {
  const session = assertSessionReady(sessionId);
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

  const nextState = normalizeState(step.updatedState);
  const safeAssistantMessage =
    asText(step.assistantMessage) ||
    `ขอบคุณที่เล่าให้ฟังนะครับ ${session.userName} 😊 ช่วยเล่าเพิ่มเติมได้ไหมว่าตอนนั้นรู้สึกยังไงบ้าง?`;

  const finalAssistantMessage =
    nextState.cards.length >= MAX_CARDS
      ? `ว้าว ${session.userName} เราได้เก็บความทรงจำดีๆ ไว้ครบแล้ว ${MAX_CARDS} เรื่องเลยครับ ✨ ขอบคุณมากเลยที่เล่าให้ฟัง กด Finish Interview เพื่อสร้างห้องได้เลยนะครับ`
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

const finishInterviewSession = async ({ sessionId }) => {
  const session = getSession(sessionId);
  if (!session) {
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

  const finalCards = ensureMinCards(
    modelCards.length > 0 ? modelCards : stateCards,
    conversation
  );

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

  await saveInterviewOutcome(session.projectId, result);

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
