import React, { useRef, useState } from 'react';
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

/* ── tiny inline styles for dark-theme cards ── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#070711',
    color: '#f0effe',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  body: {
    maxWidth: '860px',
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
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28px',
    height: '22px',
    padding: '0 8px',
    borderRadius: '999px',
    background: 'rgba(124,58,237,0.25)',
    color: '#c4b5fd',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  thumb: {
    width: '80px',
    height: '56px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLg: {
    width: '200px',
    height: '113px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMedia: {
    fontSize: '11px',
    color: '#3a394f',
    textAlign: 'center',
    padding: '4px',
  },
  name: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e0deff',
    flex: 1,
    minWidth: 0,
  },
  desc: {
    fontSize: '12px',
    color: '#5c5b72',
    marginTop: '4px',
    lineHeight: '1.5',
  },
  divider: {
    borderColor: 'rgba(255,255,255,0.07)',
    margin: '12px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#3a394f',
    fontStyle: 'italic',
  },
  moveBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#9b9ab0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  },
  errorBanner: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#f87171',
    fontSize: '13px',
    marginTop: '12px',
  },
  photosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '10px',
  },
  photoCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  photoBox: {
    width: '100%',
    aspectRatio: '1',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: '11px',
    color: '#5c5b72',
    textAlign: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

const ReviewPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const dragIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
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

  const allPhotos = [...uploadedPhotos, ...memoryPhotos];

  const memoryVideos = memories.map((memory, index) => {
    const videoUrl = normalizeVideoSource(
      pickMediaUrl(memory?.video, memory?.videoUrl, memory?.videoSrc, memory?.clip)
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

  const reorderMemory = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setProject((prev) => {
      const next = [...(prev.memories || [])];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, memories: next };
    });
  };

  const approveAndGenerate = () => {
    if (!canGenerate3D) return;
    setProject((prev) => ({ ...prev, reviewApprovedAt: new Date().toISOString() }));
    navigate('/memory-hall');
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header className="ma-header">
        <button className="ma-header-brand" onClick={() => navigate('/')}>
          <div className="ma-header-logo">M</div>
          Memoria
        </button>
        <nav className="ma-header-nav">
          <button className="ma-btn ma-btn-ghost ma-btn-sm" onClick={() => navigate('/project-detail')}>
            ← Back to Edit
          </button>
        </nav>
      </header>

      <div style={S.body}>
        {/* ── Hero ── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 600,
            margin: '0 0 8px',
            background: 'linear-gradient(135deg, #f0effe 10%, #c4b5fd 60%, #f9a8d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}>
            Review Project
          </h1>
          <p style={{ color: '#5c5b72', fontSize: '14px', margin: 0 }}>
            Review everything before entering the 3D room — drag to reorder memories
          </p>
        </div>

        {/* ── Project info ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Project Info
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#e0deff', marginBottom: '6px' }}>
            {project.title || 'Untitled Project'}
          </div>
          {project.coupleNames ? (
            <div style={{ fontSize: '13px', color: '#7c6fcd' }}>{project.coupleNames}</div>
          ) : null}
          {project.reviewApprovedAt ? (
            <div style={{ fontSize: '12px', color: '#3a394f', marginTop: '8px' }}>
              Last approved: {new Date(project.reviewApprovedAt).toLocaleString()}
            </div>
          ) : null}
        </div>

        {/* ── Photos ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Photos
            <span style={{ ...S.tag, marginLeft: 'auto' }}>{allPhotos.length}</span>
          </div>
          {allPhotos.length === 0 ? (
            <p style={S.emptyText}>No photos uploaded yet.</p>
          ) : (
            <div style={S.photosGrid}>
              {allPhotos.map((photo, index) => (
                <div style={S.photoCell} key={`${photo.source}-${photo.id}-${index}`}>
                  <div style={S.photoBox}>
                    {photo.hasPhoto ? (
                      <img
                        src={photo.url}
                        alt={photo.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '11px', opacity: 0.3 }}>no photo</span>
                    )}
                  </div>
                  <span style={S.tag}>#{photo.slot || index + 1}</span>
                  <span style={S.photoLabel}>{photo.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Text Memories ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Text Memories
            <span style={{ ...S.tag, marginLeft: 'auto' }}>{memories.length}</span>
          </div>
          {memories.length === 0 ? (
            <p style={S.emptyText}>No memories added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {memories.map((memory, index) => (
                <div
                  key={memory.id}
                  draggable
                  onDragStart={() => { dragIndex.current = index; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={() => {
                    reorderMemory(dragIndex.current, index);
                    dragIndex.current = null;
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => { dragIndex.current = null; setDragOverIndex(null); }}
                  style={{
                    background: dragOverIndex === index
                      ? 'rgba(124,58,237,0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: dragOverIndex === index
                      ? '1px solid rgba(124,58,237,0.5)'
                      : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'grab',
                    transition: 'background 0.15s, border-color 0.15s',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ color: '#3a394f', fontSize: '12px', flexShrink: 0, lineHeight: 1, letterSpacing: '1px' }}>::</span>
                  <span style={S.tag}>#{index + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.name}>{memory.title || `Memory ${index + 1}`}</div>
                    {memory.description ? (
                      <div style={S.desc}>{memory.description}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Videos ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Videos
            <span style={{ ...S.tag, marginLeft: 'auto' }}>{memoryVideos.length}</span>
          </div>
          {memoryVideos.length === 0 ? (
            <p style={S.emptyText}>No memory slots yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {memoryVideos.map((video, index) => (
                <div
                  key={`${video.id}-${index}`}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <span style={S.tag}>#{video.slot}</span>
                  <div style={S.thumbLg}>
                    {video.hasVideo ? (
                      <video
                        src={video.url}
                        preload="auto"
                        muted
                        playsInline
                        onLoadedData={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '11px', opacity: 0.3 }}>no video</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.name}>{video.name}</div>
                    {!video.hasVideo ? (
                      <div style={S.desc}>Upload video from Project Detail page.</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Audio ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>
            Audio Transcripts
            <span style={{ ...S.tag, marginLeft: 'auto' }}>{audioSlots.length}</span>
          </div>
          {audioSlots.length === 0 ? (
            <p style={S.emptyText}>No audio transcript added yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {audioSlots.map((audioSlot, index) => (
                <div
                  key={audioSlot.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ ...S.row, marginBottom: '10px' }}>
                    <span style={S.tag}>#{audioSlot.order || index + 1}</span>
                    <span style={S.name}>{audioSlot.title || `Audio ${index + 1}`}</span>
                  </div>
                  <audio
                    controls
                    src={audioSlot.audioUrl}
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      accentColor: '#7c3aed',
                    }}
                  />
                  {audioSlot.transcript ? (
                    <div style={{ ...S.desc, marginTop: '10px' }}>{audioSlot.transcript}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AI Interview ── */}
        {project.interview ? (
          <div style={S.card}>
            <div style={S.cardTitle}>
              AI Interview Summary
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#5c5b72', marginBottom: '4px', fontWeight: 600 }}>THEMES</div>
                <div style={{ fontSize: '14px', color: '#c4b5fd' }}>
                  {(project.interview.analysis?.themes || []).join(', ') || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#5c5b72', marginBottom: '4px', fontWeight: 600 }}>TONE</div>
                <div style={{ fontSize: '14px', color: '#f9a8d4' }}>
                  {project.interview.analysis?.tone || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="ma-btn ma-btn-ghost"
            type="button"
            onClick={() => navigate('/project-detail')}
          >
            ← Back to Edit
          </button>
          <button
            className="ma-btn ma-btn-primary"
            type="button"
            onClick={approveAndGenerate}
            disabled={!canGenerate3D}
            style={{ opacity: canGenerate3D ? 1 : 0.45, cursor: canGenerate3D ? 'pointer' : 'not-allowed' }}
          >
            Generate 3D Room
          </button>
        </div>

        {!canGenerate3D ? (
          <div style={S.errorBanner}>
            Add at least 1 memory slot (photo / text / audio) before generating 3D room.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReviewPage;
