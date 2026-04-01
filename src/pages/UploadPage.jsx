import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcribeAudio } from '../services/sttApi';

const UploadPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDescription, setMemoryDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState(null);
  const [selectedAudioPreviewUrl, setSelectedAudioPreviewUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [lastTranscript, setLastTranscript] = useState('');
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const updateField = (field, value) => {
    setProject((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newPhotos = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      name: file.name,
      source: 'upload'
    }));

    setProject((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const handleAddMemory = () => {
    if (!memoryTitle.trim()) return;

    setProject((prev) => ({
      ...prev,
      memories: [
        ...prev.memories,
        {
          id: `${Date.now()}`,
          title: memoryTitle,
          description: memoryDescription
        }
      ]
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
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });
        const url = URL.createObjectURL(blob);
        setRecordedAudio((previous) => {
          if (previous?.url) {
            URL.revokeObjectURL(previous.url);
          }
          return {
            blob,
            url,
            name: `recording-${Date.now()}.webm`
          };
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
        filename: selectedAudioFile?.name || recordedAudio?.name || 'recording.webm'
      });

      setProject((prev) => ({
        ...prev,
        audioSlots: [...(prev.audioSlots || []), payload.slot]
      }));

      setLastTranscript(payload.transcript || '');
    } catch (error) {
      setTranscriptionError(error.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (!selectedAudioFile) {
      setSelectedAudioPreviewUrl('');
      return undefined;
    }

    const url = URL.createObjectURL(selectedAudioFile);
    setSelectedAudioPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedAudioFile]);

  useEffect(
    () => () => {
      if (recordedAudio?.url) {
        URL.revokeObjectURL(recordedAudio.url);
      }
    },
    [recordedAudio]
  );

  const previewAudioUrl = selectedAudioPreviewUrl || recordedAudio?.url || '';

  return (
    <div className="app-shell">
      <h1 className="page-title">Upload Project Details</h1>
      <p className="page-subtitle">
        Capture the essentials for the memory room before generating the 3D view.
      </p>

      <div className="section">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="projectTitle">Project Title</label>
            <input
              id="projectTitle"
              type="text"
              placeholder="e.g. Our First Year"
              value={project.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="coupleNames">Couple Names</label>
            <input
              id="coupleNames"
              type="text"
              placeholder="e.g. Ava & Liam"
              value={project.coupleNames}
              onChange={(event) => updateField('coupleNames', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Upload Photos</h2>
        <p className="helper">Add multiple images. These will become the room frames.</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
        />
        <div className="photo-grid" style={{ marginTop: '16px' }}>
          {project.photos.map((photo) => (
            <div className="photo-thumb" key={photo.id}>
              <img src={photo.url} alt={photo.name} />
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>AI Interview Assistant</h2>
        <p className="helper">
          Run a 10-minute adaptive text interview, then auto-generate memory cards for this project.
        </p>
        <div className="button-row" style={{ marginTop: '12px' }}>
          <button className="button" type="button" onClick={() => navigate('/interview')}>
            Open AI Interview
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Add Text Memories</h2>
        <div className="field">
          <label htmlFor="memoryTitle">Memory Title</label>
          <input
            id="memoryTitle"
            type="text"
            placeholder="e.g. First Dance"
            value={memoryTitle}
            onChange={(event) => setMemoryTitle(event.target.value)}
          />
        </div>
        <div className="field" style={{ marginTop: '16px' }}>
          <label htmlFor="memoryDescription">Short Description</label>
          <textarea
            id="memoryDescription"
            rows={3}
            placeholder="Write a brief note about the moment"
            value={memoryDescription}
            onChange={(event) => setMemoryDescription(event.target.value)}
          />
        </div>
        <div className="button-row" style={{ marginTop: '16px' }}>
          <button className="button" type="button" onClick={handleAddMemory}>
            Add Memory
          </button>
        </div>
        <div className="memory-list" style={{ marginTop: '16px' }}>
          {project.memories.map((memory, index) => (
            <div className="memory-card" key={memory.id}>
              <div className="list-item">
                <span className="order-tag">#{index + 1}</span>
                <strong>{memory.title}</strong>
              </div>
              <div className="small-note">{memory.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Optional Voice Interview (Batch STT)</h2>
        <p className="helper">
          Record audio or upload one file, then transcribe and save it to this project.
        </p>
        <div className="button-row">
          <button
            className="button"
            type="button"
            onClick={startRecording}
            disabled={isRecording || isTranscribing}
          >
            Start Recording
          </button>
          <button
            className="button"
            type="button"
            onClick={stopRecording}
            disabled={!isRecording || isTranscribing}
          >
            Stop Recording
          </button>
          <label className="button" htmlFor="audioUploadInput">
            Upload Audio File
          </label>
          <input
            id="audioUploadInput"
            type="file"
            accept="audio/*"
            onChange={handleAudioFileSelect}
            style={{ display: 'none' }}
          />
          <button
            className="button primary"
            type="button"
            onClick={handleTranscribeAudio}
            disabled={isRecording || isTranscribing || (!selectedAudioFile && !recordedAudio)}
          >
            {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
          </button>
        </div>

        {recordedAudio ? (
          <p className="helper">Recorded file ready: {recordedAudio.name}</p>
        ) : null}
        {selectedAudioFile ? (
          <p className="helper">Selected file: {selectedAudioFile.name}</p>
        ) : null}
        {previewAudioUrl ? <audio className="audio-player" controls src={previewAudioUrl} /> : null}
        {transcriptionError ? <p className="error-text">{transcriptionError}</p> : null}
        {lastTranscript ? (
          <div className="memory-card" style={{ marginTop: '12px' }}>
            <div className="list-item">
              <strong>Latest Transcript</strong>
            </div>
            <div className="small-note">{lastTranscript}</div>
          </div>
        ) : null}
      </div>

      <div className="button-row">
        <button className="button primary" type="button" onClick={() => navigate('/review')}>
          Save &amp; Review
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
