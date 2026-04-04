import React from 'react';
import { useNavigate } from 'react-router-dom';

const pickMediaUrl = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return '';
};

const normalizeVideoSource = (source) => {
  if (typeof source !== 'string' || source.trim().length === 0) {
    return '';
  }

  if (/^(https?:|blob:|data:)/i.test(source)) {
    return source;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (isLocalHost && source.startsWith('/uploads/')) {
      return `${protocol}//${host}:5000${source}`;
    }

    try {
      return new URL(source, window.location.origin).toString();
    } catch {
      return source;
    }
  }

  return source;
};

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
  const memoryVideos = memories.map((memory, index) => {
    const videoUrl = normalizeVideoSource(
      pickMediaUrl(
        memory?.video,
        memory?.videoUrl,
        memory?.videoSrc,
        memory?.clip
      )
    );

    return {
      id: memory?.id || `memory-video-${index}`,
      url: videoUrl,
      name: memory?.title || `Memory ${index + 1}`,
      slot: index + 1,
      hasVideo: Boolean(videoUrl),
    };
  });

  const memorySlotCount = Math.max(
    photos.length,
    memories.length,
    textSlots.length,
    audioSlots.length
  );
  const canGenerate3D = memorySlotCount > 0;

  const moveMemory = (index, direction) => {
    setProject((prev) => {
      const next = [...(prev.memories || [])];
      const targetIndex = index + direction;
      if (
        index < 0 ||
        targetIndex < 0 ||
        index >= next.length ||
        targetIndex >= next.length
      ) {
        return prev;
      }

      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;

      return {
        ...prev,
        memories: next,
      };
    });
  };

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
                <div className="button-row" style={{ marginTop: '8px' }}>
                  <button
                    className="button"
                    type="button"
                    onClick={() => moveMemory(index, -1)}
                    disabled={index === 0}
                    aria-label="Move memory up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="button"
                    type="button"
                    onClick={() => moveMemory(index, 1)}
                    disabled={index === memories.length - 1}
                    aria-label="Move memory down"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Videos</h2>
        {memoryVideos.length === 0 ? (
          <p className="helper">No memory slots yet.</p>
        ) : (
          <div className="memory-list">
            {memoryVideos.map((video, index) => (
              <div className="memory-card" key={`${video.id}-${index}`}>
                <div className="list-item">
                  <span className="order-tag">#{video.slot}</span>
                  <strong>{video.name}</strong>
                </div>
                <div className="photo-thumb" style={{ width: '220px', height: '124px' }}>
                  {video.hasVideo ? (
                    <video
                      src={video.url}
                      preload="auto"
                      muted
                      playsInline
                      onLoadedData={(event) => {
                        event.currentTarget.pause();
                        event.currentTarget.currentTime = 0;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="small-note">No video</div>
                  )}
                </div>
                {!video.hasVideo ? (
                  <div className="small-note" style={{ marginTop: '8px' }}>
                    Upload video from Project Detail page.
                  </div>
                ) : null}
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
