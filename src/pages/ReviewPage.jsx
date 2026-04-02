import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const photos = project?.photos || [];
  const memories = project?.memories || [];
  const textSlots = project?.textSlots || [];
  const audioSlots = project?.audioSlots || [];
  const memoryPhotos = memories.map((memory, index) => ({
    id: memory?.id || `memory-photo-${index}`,
    url: memory?.photo || '',
    name: memory?.title || `Memory ${index + 1}`,
    source: 'memory',
    slot: index + 1,
    hasPhoto: Boolean(memory?.photo),
  }));

  const uploadedPhotos = photos
    .filter((photo) => Boolean(photo?.url))
    .map((photo, index) => ({
      id: photo?.id || `photo-${index}`,
      url: photo?.url || '',
      name: photo?.name || `Photo ${index + 1}`,
      source: 'upload',
      hasPhoto: Boolean(photo?.url),
    }));

  const allPhotos = [
    ...uploadedPhotos,
    ...memoryPhotos,
  ];

  const memorySlotCount = Math.max(
    photos.length,
    memories.length,
    textSlots.length,
    audioSlots.length
  );
  const canGenerate3D = memorySlotCount > 0;

  const approveAndGenerate = () => {
    if (!canGenerate3D) return;

    setProject((prev) => ({
      ...prev,
      reviewApprovedAt: new Date().toISOString(),
    }));
    navigate('/memory-hall');
  };

  return (
    <div className="app-shell">
      <h1 className="page-title">Review Project</h1>
      <p className="page-subtitle">
        Review & Organize (Required): check everything before entering 3D room.
      </p>

      <div className="section">
        <h2>{project.title || 'Untitled Project'}</h2>
        <p className="helper">{project.coupleNames || 'No couple names added yet.'}</p>
        {project.reviewApprovedAt ? (
          <p className="helper">Last approved: {new Date(project.reviewApprovedAt).toLocaleString()}</p>
        ) : null}
      </div>

      <div className="section">
        <h2>Photos</h2>
        {allPhotos.length === 0 ? (
          <p className="helper">No photos uploaded yet.</p>
        ) : (
          <div className="memory-list">
            {allPhotos.map((photo, index) => (
              <div className="list-item" key={`${photo.source}-${photo.id}-${index}`}>
                <span className="order-tag">#{photo.slot || index + 1}</span>
                <div className="photo-thumb" style={{ width: '120px' }}>
                  {photo.hasPhoto ? (
                    <img src={photo.url} alt={photo.name} />
                  ) : (
                    <div className="small-note">ไม่มีรูป</div>
                  )}
                </div>
                <div>
                  {photo.name}
                  {!photo.hasPhoto ? (
                    <div className="small-note">ไม่มีรูป</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Text Memories</h2>
        {memories.length === 0 ? (
          <p className="helper">No memories added yet.</p>
        ) : (
          <div className="memory-list">
            {memories.map((memory, index) => (
              <div className="memory-card" key={memory.id}>
                <div className="list-item">
                  <span className="order-tag">#{index + 1}</span>
                  <strong>{memory.title}</strong>
                </div>
                <div className="small-note">{memory.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Audio Transcripts</h2>
        {audioSlots.length === 0 ? (
          <p className="helper">No audio transcript added yet.</p>
        ) : (
          <div className="memory-list">
            {audioSlots.map((audioSlot, index) => (
              <div className="memory-card" key={audioSlot.id}>
                <div className="list-item">
                  <span className="order-tag">#{audioSlot.order || index + 1}</span>
                  <strong>{audioSlot.title || `Audio ${index + 1}`}</strong>
                </div>
                <audio className="audio-player" controls src={audioSlot.audioUrl} />
                <div className="small-note" style={{ marginTop: '8px' }}>
                  {audioSlot.transcript || 'No transcript text.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {project.interview ? (
        <div className="section">
          <h2>AI Interview Summary</h2>
          <p className="helper">
            Themes: {(project.interview.analysis?.themes || []).join(', ') || 'N/A'}
          </p>
          <p className="helper">Tone: {project.interview.analysis?.tone || 'N/A'}</p>
        </div>
      ) : null}

      <div className="button-row">
        <button className="button" type="button" onClick={() => navigate('/project-detail')}>
          Back to Edit
        </button>
        <button
          className="button primary"
          type="button"
          onClick={approveAndGenerate}
          disabled={!canGenerate3D}
        >
          Generate 3D Room
        </button>
      </div>
      {!canGenerate3D ? (
        <p className="error-text" style={{ marginTop: '12px' }}>
          Add at least 1 memory slot (photo/text/audio) before generating 3D room.
        </p>
      ) : null}
    </div>
  );
};

export default ReviewPage;
