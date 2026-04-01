import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewPage = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <h1 className="page-title">Review Project</h1>
      <p className="page-subtitle">Check the order before generating the 3D room.</p>

      <div className="section">
        <h2>{project.title || 'Untitled Project'}</h2>
        <p className="helper">{project.coupleNames || 'No couple names added yet.'}</p>
      </div>

      <div className="section">
        <h2>Photos</h2>
        {project.photos.length === 0 ? (
          <p className="helper">No photos uploaded yet.</p>
        ) : (
          <div className="memory-list">
            {project.photos.map((photo, index) => (
              <div className="list-item" key={photo.id}>
                <span className="order-tag">#{index + 1}</span>
                <div className="photo-thumb" style={{ width: '120px' }}>
                  <img src={photo.url} alt={photo.name} />
                </div>
                <div>{photo.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Text Memories</h2>
        {project.memories.length === 0 ? (
          <p className="helper">No memories added yet.</p>
        ) : (
          <div className="memory-list">
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
        )}
      </div>

      <div className="section">
        <h2>Audio Transcripts</h2>
        {!project.audioSlots || project.audioSlots.length === 0 ? (
          <p className="helper">No audio transcript added yet.</p>
        ) : (
          <div className="memory-list">
            {project.audioSlots.map((audioSlot, index) => (
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
        <button className="button primary" type="button" onClick={() => navigate('/viewer')}>
          Generate 3D Room
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;
