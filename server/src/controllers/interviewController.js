const {
  startInterviewSession,
  sendInterviewMessage,
  finishInterviewSession
} = require("../services/interviewService");

const startInterview = async (req, res, next) => {
  try {
    const payload = await startInterviewSession({
      userId: req.user.id,
      projectId: req.body?.projectId,
      userName: req.body?.userName,
      durationMinutes: req.body?.durationMinutes
    });
    res.status(200).json({ ok: true, ...payload });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const payload = await sendInterviewMessage({
      userId: req.user.id,
      sessionId: req.body?.sessionId,
      message: req.body?.message
    });
    res.status(200).json({ ok: true, ...payload });
  } catch (error) {
    next(error);
  }
};

const finishInterview = async (req, res, next) => {
  try {
    const payload = await finishInterviewSession({
      userId: req.user.id,
      sessionId: req.body?.sessionId
    });
    res.status(200).json({ ok: true, ...payload });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  sendMessage,
  finishInterview
};
