import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio } from '../services/sttApi';
import { uploadPhoto } from '../services/mediaApi';

const S = {
  page: {
    minHeight: '100vh',
    background: '#070711',
    color: '#f0effe',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  body: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '36px 24px 72px',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#7c6fcd',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#9b9ab0',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#f0effe',
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#f0effe',
    fontFamily: "'Space Grotesk', sans-serif",
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  field: {
    marginBottom: '16px',
  },
  helper: {
    fontSize: '13px',
    color: '#5c5b72',
    marginBottom: '14px',
  },
  errorText: {
    fontSize: '13px',
    color: '#f87171',
    marginTop: '8px',
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.18)',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '10px',
    marginTop: '14px',
  },
  photoThumb: {
    aspectRatio: '1',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
  },
  uploadLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#c4b5fd',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    transition: 'background 0.15s',
  },
  memoryCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '26px',
    height: '20px',
    padding: '0 7px',
    borderRadius: '999px',
    background: 'rgba(124,58,237,0.25)',
    color: '#c4b5fd',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
    marginTop: '2px',
  },
  transcriptBox: {
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#c4b5fd',
    lineHeight: '1.6',
  },
};

const UploadPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDescription, setMemoryDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [selectedAudioPreviewUrl, setSelectedAudioPreviewUrl] = useState('');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const updateField = (field, value) => {
    setProject((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploadingPhotos(true);
    setPhotoUploadError('');

    const results = await Promise.allSettled(
      files.map((file) =>
        uploadPhoto({ projectId: project.id, photoFile: file }).then((payload) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url: payload.photoUrl,
          name: file.name,
          source: 'upload',
        }))
      )
    );

    const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) setPhotoUploadError(`${failed} photo(s) failed to upload.`);
    if (uploaded.length > 0) {
      setProject((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
    }

    setIsUploadingPhotos(false);
    event.target.value = '';
  };

  const handleAddMemory = () => {
    if (!memoryTitle.trim()) return;
    setProject((prev) => ({
      ...prev,
      memories: [
        ...prev.memories,
        { id: `${Date.now()}`, title: memoryTitle, description: memoryDescription },
      ],
    }));
    setMemoryTitle('');
    setMemoryDescription('');
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (
      typeof MediaRecorder === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setTranscriptionError('This browser does not support audio recording.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorderRef.current = recorder;
      setTranscriptionError('');
      setLastTranscript('');
      setSelectedAudioFile(null);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio((previous) => {
          if (previous?.url) URL.revokeObjectURL(previous.url);
          return { blob, url, name: `recording-${Date.now()}.webm` };
        });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setTranscriptionError('Recording failed. Please try again.');
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setTranscriptionError('Microphone permission denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return;
    recorderRef.current.stop();
  };

  const handleAudioFileSelect = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedAudioFile(file);
    setLastTranscript('');
    setTranscriptionError('');
  };

  const handleTranscribeAudio = async () => {
    const sourceBlob = selectedAudioFile || recordedAudio?.blob;
    if (!sourceBlob) {
      setTranscriptionError('Please record or upload an audio file first.');
      return;
    }
    try {
      setIsTranscribing(true);
      setTranscriptionError('');
      const payload = await transcribeAudio({
        projectId: project.id,
        audioBlob: sourceBlob,
        filename: selectedAudioFile?.name || recordedAudio?.name || 'recording.webm',
      });
      setProject((prev) => ({
        ...prev,
        audioSlots: [...(prev.audioSlots || []), payload.slot],
      }));
      setLastTranscript(payload.transcript || '');
    } catch (error) {
      setTranscriptionError(error.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (!selectedAudioFile) { setSelectedAudioPreviewUrl(''); return undefined; }
    const url = URL.createObjectURL(selectedAudioFile);
    setSelectedAudioPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedAudioFile]);

  useEffect(
    () => () => { if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url); },
    [recordedAudio]
  );

  const previewAudioUrl = selectedAudioPreviewUrl || recordedAudio?.url || '';

  return (
    <div style={S.page}>
      {/* Header */}
      <header className="ma-header">
        <button className="ma-header-brand" onClick={() => navigate('/')}>
          <div className="ma-header-logo">M</div>
          Memoria
        </button>
        <nav className="ma-header-nav">
          <button className="ma-btn ma-btn-ghost ma-btn-sm" onClick={() => navigate('/project-detail')}>
            ← Back
          </button>
        </nav>
      </header>

      <div style={S.body}>
        {/* Hero */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 34px)',
            fontWeight: 600,
            margin: '0 0 8px',
            background: 'linear-gradient(135deg, #f0effe 10%, #c4b5fd 60%, #f9a8d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}>
            Upload Project Details
          </h1>
          <p style={S.helper}>
            Capture the essentials for the memory room before generating the 3D view.
          </p>
        </div>

        {/* Project Info */}
        <div style={S.card}>
          <div style={S.cardTitle}>Project Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={S.field}>
              <label style={S.label}>Project Title</label>
              <input
                style={S.input}
                type="text"
                placeholder="e.g. Our First Year"
                value={project.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>
            <div style={S.field}>
              <label style={S.label}>Couple Names</label>
              <input
                style={S.input}
                type="text"
                placeholder="e.g. Ava & Liam"
                value={project.coupleNames}
                onChange={(e) => updateField('coupleNames', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Upload Photos
            <span style={{
              marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
              padding: '2px 10px', borderRadius: '999px',
              background: 'rgba(124,58,237,0.2)', color: '#c4b5fd',
            }}>
              {project.photos.length}
            </span>
          </div>
          <p style={S.helper}>Add multiple images. These will become the room frames.</p>

          <label style={S.uploadLabel}>
            {isUploadingPhotos ? '⏳ Uploading...' : '+ Choose Photos'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={isUploadingPhotos}
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </label>

          {photoUploadError ? <div style={S.errorText}>{photoUploadError}</div> : null}

          {project.photos.length > 0 && (
            <div style={S.photoGrid}>
              {project.photos.map((photo) => (
                <div style={S.photoThumb} key={photo.id}>
                  <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Interview */}
        <div style={S.card}>
          <div style={S.cardTitle}>AI Interview Assistant</div>
          <p style={S.helper}>
            Run a 10-minute adaptive interview, then auto-generate memory cards for this project.
          </p>
          <button className="ma-btn ma-btn-primary" type="button" onClick={() => navigate('/interview')}>
            Open AI Interview
          </button>
        </div>

        {/* Add Text Memories */}
        <div style={S.card}>
          <div style={S.cardTitle}>Add Text Memories</div>
          <div style={S.field}>
            <label style={S.label}>Memory Title</label>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. First Dance"
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMemory(); }}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Short Description</label>
            <textarea
              style={S.textarea}
              rows={3}
              placeholder="Write a brief note about the moment"
              value={memoryDescription}
              onChange={(e) => setMemoryDescription(e.target.value)}
            />
          </div>
          <button
            className="ma-btn ma-btn-ghost ma-btn-sm"
            type="button"
            onClick={handleAddMemory}
            disabled={!memoryTitle.trim()}
            style={{ opacity: memoryTitle.trim() ? 1 : 0.4 }}
          >
            + Add Memory
          </button>

          {project.memories.length > 0 && (
            <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
              {project.memories.map((memory, index) => (
                <div style={S.memoryCard} key={memory.id}>
                  <span style={S.tag}>#{index + 1}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0deff' }}>{memory.title}</div>
                    {memory.description ? (
                      <div style={{ fontSize: '12px', color: '#5c5b72', marginTop: '4px' }}>{memory.description}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice / Audio */}
        <div style={S.card}>
          <div style={S.cardTitle}>Optional Voice Interview (Batch STT)</div>
          <p style={S.helper}>
            Record audio or upload one file, then transcribe and save it to this project.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button
              className="ma-btn ma-btn-ghost ma-btn-sm"
              type="button"
              onClick={startRecording}
              disabled={isRecording || isTranscribing}
              style={{ opacity: (isRecording || isTranscribing) ? 0.4 : 1 }}
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            <button
              className="ma-btn ma-btn-ghost ma-btn-sm"
              type="button"
              onClick={stopRecording}
              disabled={!isRecording || isTranscribing}
              style={{ opacity: (!isRecording || isTranscribing) ? 0.4 : 1 }}
            >
              ⏹ Stop
            </button>
            <label style={S.uploadLabel}>
              Upload Audio
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="ma-btn ma-btn-primary ma-btn-sm"
              type="button"
              onClick={handleTranscribeAudio}
              disabled={isRecording || isTranscribing || (!selectedAudioFile && !recordedAudio)}
              style={{ opacity: (isRecording || isTranscribing || (!selectedAudioFile && !recordedAudio)) ? 0.4 : 1 }}
            >
              {isTranscribing ? 'Transcribing...' : 'Transcribe'}
            </button>
          </div>

          {recordedAudio ? (
            <p style={{ ...S.helper, marginBottom: '8px' }}>Ready: {recordedAudio.name}</p>
          ) : null}
          {selectedAudioFile ? (
            <p style={{ ...S.helper, marginBottom: '8px' }}>Selected: {selectedAudioFile.name}</p>
          ) : null}
          {previewAudioUrl ? (
            <audio controls src={previewAudioUrl} style={{ width: '100%', borderRadius: '8px', marginBottom: '10px', accentColor: '#7c3aed' }} />
          ) : null}
          {transcriptionError ? <div style={S.errorText}>{transcriptionError}</div> : null}
          {lastTranscript ? (
            <div style={S.transcriptBox}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c6fcd', marginBottom: '6px' }}>TRANSCRIPT</div>
              {lastTranscript}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="ma-btn ma-btn-ghost" type="button" onClick={() => navigate('/project-detail')}>
            ← Back
          </button>
          <button className="ma-btn ma-btn-primary" type="button" onClick={() => navigate('/review')}>
            Save & Review →
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
