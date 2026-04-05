import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startInterview,
  sendInterviewMessage,
  finishInterview
} from '../services/interviewApi';
import { transcribeAudio } from '../services/sttApi';

const DEFAULT_DURATION_MINUTES = 10;

// VAD config — how long silence before we consider speech done
const VAD_SILENCE_THRESHOLD = 0.015;
const VAD_SILENCE_MS = 1400;  // 1.4s silence → stop
const VAD_MIN_SPEECH_MS = 500; // need at least 0.5s of speech

const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = (safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const findLatestAssistantMessage = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === 'assistant' && String(message.content || '').trim()) {
      return message;
    }
  }
  return null;
};

const sanitizeTextForSpeech = (value) =>
  String(value || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// voiceState: 'idle' | 'listening' | 'transcribing' | 'thinking'

const InterviewPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(project.coupleNames || '');
  const [sessionId, setSessionId] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [messages, setMessages] = useState([]);
  const [voiceState, setVoiceState] = useState('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [result, setResult] = useState(null);
  const [showSetup, setShowSetup] = useState(true);

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isTtsSupported, setIsTtsSupported] = useState(true);
  const [hasEnglishVoice, setHasEnglishVoice] = useState(false);

  const autoFinishingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const vadFrameRef = useRef(null);
  const silenceStartRef = useRef(null);
  const speechStartRef = useRef(null);
  const messagesEndRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const ttsVoiceRef = useRef(null);
  const speakTimerRef = useRef(null);

  const hasActiveSession = Boolean(sessionId) && !result;
  const isProcessing = voiceState === 'transcribing' || voiceState === 'thinking';

  // auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // timer countdown
  useEffect(() => {
    if (!hasActiveSession || remainingSeconds <= 0) return;
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasActiveSession, remainingSeconds]);

  useEffect(() => {
    const hasUtteranceSupport =
      typeof window !== 'undefined' &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';
    const synth = synthRef.current;

    if (!hasUtteranceSupport || !synth) {
      setIsTtsSupported(false);
      setTtsEnabled(false);
      return undefined;
    }

    const pickVoice = () => {
      const voices = synth.getVoices();
      if (!Array.isArray(voices) || voices.length === 0) {
        ttsVoiceRef.current = null;
        setHasEnglishVoice(false);
        return;
      }

      ttsVoiceRef.current =
        voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith('en')) ||
        voices.find((voice) => voice.default) ||
        voices[0] ||
        null;
      setHasEnglishVoice(Boolean(ttsVoiceRef.current));
    };

    pickVoice();
    synth.addEventListener?.('voiceschanged', pickVoice);

    return () => {
      synth.removeEventListener?.('voiceschanged', pickVoice);
    };
  }, []);

  // cleanup mic + VAD + TTS on unmount
  useEffect(() => {
    return () => {
      if (speakTimerRef.current) {
        window.clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      synthRef.current?.cancel();
      if (vadFrameRef.current) {
        cancelAnimationFrame(vadFrameRef.current);
        vadFrameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
    };
  }, []);

  const stopVAD = () => {
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
  };

  const speakText = useCallback((text) => {
    const content = sanitizeTextForSpeech(text);
    const synth = synthRef.current;

    if (
      !content ||
      !ttsEnabled ||
      !isTtsSupported ||
      !synth ||
      typeof window === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }

    synth.cancel();
    synth.resume?.();

    const utterance = new window.SpeechSynthesisUtterance(content);
    utterance.lang = 'en-US';
    if (ttsVoiceRef.current) {
      utterance.voice = ttsVoiceRef.current;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    speakTimerRef.current = window.setTimeout(() => {
      synth.speak(utterance);
      speakTimerRef.current = null;
    }, 40);
  }, [isTtsSupported, ttsEnabled]);

  const stopSpeaking = useCallback(() => {
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    synthRef.current?.cancel();
  }, []);

  const handleFinish = useCallback(async () => {
    if (!sessionId || isFinishing || result) return;
    try {
      setIsFinishing(true);
      setErrorMessage('');
      const payload = await finishInterview({ sessionId });
      setResult(payload);
      setRemainingSeconds(0);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to finish.');
    } finally {
      setIsFinishing(false);
    }
  }, [sessionId, isFinishing, result]);

  // auto-finish when time runs out
  useEffect(() => {
    if (!hasActiveSession || remainingSeconds > 0 || autoFinishingRef.current) return;
    autoFinishingRef.current = true;
    handleFinish().finally(() => { autoFinishingRef.current = false; });
  }, [hasActiveSession, remainingSeconds, handleFinish]);

  const handleStart = async () => {
    if (!userName.trim()) {
      setErrorMessage('Please enter your name before starting.');
      return;
    }
    try {
      setIsStarting(true);
      setErrorMessage('');
      const payload = await startInterview({
        projectId: project.id,
        userName: userName.trim(),
        durationMinutes: DEFAULT_DURATION_MINUTES,
      });
      setSessionId(payload.sessionId);
      setRemainingSeconds(payload.remainingSeconds || DEFAULT_DURATION_MINUTES * 60);
      setMessages(payload.messages || []);
      setShowSetup(false);
      const firstAssistant = findLatestAssistantMessage(payload.messages || []);
      if (firstAssistant) {
        speakText(firstAssistant.content);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to start.');
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async (text) => {
    const outgoing = text.trim();
    if (!sessionId || !outgoing) return;
    setVoiceState('thinking');
    try {
      const payload = await sendInterviewMessage({ sessionId, message: outgoing });
      // payload.messages = [userMessage, assistantMessage]
      setMessages((prev) => [...prev, ...(payload.messages || [])]);
      if (typeof payload.remainingSeconds === 'number') {
        setRemainingSeconds(payload.remainingSeconds);
      }
      // speak AI reply
      const aiMsg = findLatestAssistantMessage(payload.messages || []);
      if (aiMsg) speakText(aiMsg.content);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send.');
    } finally {
      setVoiceState('idle');
    }
  };

  const startListening = async () => {
    if (!hasActiveSession || isProcessing || voiceState === 'listening') return;
    stopSpeaking(); // stop AI speech before user starts speaking
    setErrorMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // AudioContext for VAD (voice activity detection)
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
        audioCtxRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        if (blob.size < 1500) {
          setVoiceState('idle');
          setAudioLevel(0);
          return;
        }

        setVoiceState('transcribing');
        setAudioLevel(0);

        try {
          const sttResult = await transcribeAudio({
            projectId: project.id,
            audioBlob: blob,
            filename: 'voice.webm',
            language: 'th',
          });
          const transcript = (sttResult.transcript || '').trim();
          if (transcript) {
            await sendMessage(transcript);
          } else {
            setVoiceState('idle');
          }
        } catch (err) {
          setErrorMessage('Transcription failed: ' + (err.message || 'Please try again.'));
          setVoiceState('idle');
        }
      };

      recorder.start();
      setVoiceState('listening');
      speechStartRef.current = null;
      silenceStartRef.current = null;

      // VAD loop — detect silence after speech
      const buffer = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const rms = Math.sqrt(buffer.reduce((sum, v) => sum + v * v, 0) / buffer.length);
        setAudioLevel(Math.min(1, rms * 25));

        const now = Date.now();

        if (rms > VAD_SILENCE_THRESHOLD) {
          // user is speaking
          if (!speechStartRef.current) speechStartRef.current = now;
          silenceStartRef.current = null;
        } else {
          // silence
          if (speechStartRef.current) {
            if (!silenceStartRef.current) silenceStartRef.current = now;
            const silenceDuration = now - silenceStartRef.current;
            const speechDuration = now - speechStartRef.current;

            if (silenceDuration > VAD_SILENCE_MS && speechDuration > VAD_MIN_SPEECH_MS) {
              // enough speech + enough silence → done
              stopVAD();
              recorder.stop();
              return;
            }
          }
        }

        vadFrameRef.current = requestAnimationFrame(tick);
      };
      vadFrameRef.current = requestAnimationFrame(tick);

    } catch {
      setErrorMessage('Microphone access denied. Please allow microphone permission.');
      setVoiceState('idle');
    }
  };

  const cancelListening = () => {
    stopVAD();
    if (mediaRecorderRef.current?.state === 'recording') {
      // override onstop to just cleanup, not transcribe
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
        audioCtxRef.current = null;
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
    }
    setAudioLevel(0);
    setVoiceState('idle');
  };

  const applyResultToProject = () => {
    if (!result) return;
    const roomPayload = result.roomPayload || {};
    const textSlots = Array.isArray(roomPayload.textSlots) ? roomPayload.textSlots : [];
    setProject((prev) => ({
      ...prev,
      coupleNames: userName.trim() || prev.coupleNames,
      memories: textSlots.map((s) => ({ id: s.id, title: s.title, description: s.text })),
      textSlots,
      roomPayload,
      interview: {
        sessionId: result.sessionId,
        completedAt: result.completedAt,
        analysis: result.analysis,
        transcript: result.transcript,
      },
    }));
    navigate('/review');
  };

  const orbClass = [
    'voice-orb',
    voiceState === 'listening' ? 'listening' : '',
    isProcessing ? 'processing' : '',
  ].filter(Boolean).join(' ');

  // dynamic scale from audio level while listening
  const orbStyle = voiceState === 'listening'
    ? { transform: `scale(${1 + audioLevel * 0.35})` }
    : {};

  const stateLabel = {
    idle: result ? 'Interview complete' : 'Tap the mic to speak',
    listening: 'Listening...',
    transcribing: 'Transcribing...',
    thinking: 'Thinking...',
  }[voiceState] || '';

  // ── Setup screen ──────────────────────────────────────
  if (showSetup) {
    return (
      <div className="voice-setup">
        <h1>Start Interview</h1>
        <p>Talk with AI to preserve your memories in the 3D Room</p>
        <input
          type="text"
          placeholder="Your name..."
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          autoFocus
        />
        {errorMessage && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{errorMessage}</p>}
        <button className="voice-setup-start" onClick={handleStart} disabled={isStarting}>
          {isStarting ? 'Starting...' : 'Start'}
        </button>
        <button className="voice-setup-back" onClick={() => navigate('/project-detail')}>
          &larr; Back
        </button>
      </div>
    );
  }

  // ── Main voice UI ─────────────────────────────────────
  return (
    <div className="voice-page">

      {/* Header */}
      <div className="voice-header">
        <span className="voice-timer">{formatTime(remainingSeconds)}</span>
        <button
          className="voice-tts-toggle"
          onClick={() => {
            if (!isTtsSupported) return;
            setTtsEnabled((v) => !v);
            stopSpeaking();
          }}
          title={
            !isTtsSupported
              ? 'Browser does not support AI voice playback'
              : !hasEnglishVoice
                ? 'No English voice found. Playback may be limited.'
              : (ttsEnabled ? 'Mute AI voice' : 'Enable AI voice')
          }
          disabled={!isTtsSupported}
        >
          {ttsEnabled ? 'Voice On' : 'Voice Off'}
        </button>
        <button
          className="voice-finish-btn"
          onClick={handleFinish}
          disabled={isFinishing || !!result}
        >
          {isFinishing ? 'Finishing...' : 'Finish Interview'}
        </button>
      </div>

      {/* Messages */}
      <div className="voice-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="voice-msg-row"
            style={{ justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div className={`voice-bubble ${msg.role === 'user' ? 'voice-bubble-user' : 'voice-bubble-ai'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Orb */}
      <div className="voice-orb-area">
        <div className={orbClass} style={orbStyle} />
        <p className="voice-state-label">{stateLabel}</p>
      </div>

      {/* Controls */}
      <div className="voice-controls">
        {voiceState === 'idle' && !result && (
          <button className="voice-mic-btn" onClick={startListening} disabled={!hasActiveSession}>
            Mic
          </button>
        )}
        {voiceState === 'listening' && (
          <button className="voice-cancel-btn" onClick={cancelListening}>
            Cancel
          </button>
        )}
        {isProcessing && (
          <div className="voice-spinner" />
        )}
      </div>

      {errorMessage && <p className="voice-error">{errorMessage}</p>}

      {/* Result */}
      {result && (
        <div className="voice-result">
          <p className="voice-result-title">
            {result.roomPayload?.textSlots?.length || 0} memories captured
          </p>
          {(result.roomPayload?.textSlots || []).map((slot, i) => (
            <div key={slot.id} className="voice-card">
              <strong>#{i + 1} {slot.title}</strong>
              <p>{slot.text}</p>
            </div>
          ))}
          <button className="voice-apply-btn" onClick={applyResultToProject}>
            Go to Review &rarr; 3D
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
