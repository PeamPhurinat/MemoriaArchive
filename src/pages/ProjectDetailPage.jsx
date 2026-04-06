import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadMemoryVideo, uploadPhoto } from '../services/mediaApi';
import { toggleShare } from '../services/projectApi';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const ProjectDetailPage = ({ project, setProject }) => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [uploadingVideoById, setUploadingVideoById] = useState({});
  const [uploadingPhotoById, setUploadingPhotoById] = useState({});
  const [uploadingHallPhoto, setUploadingHallPhoto] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState('');
  const [isShared, setIsShared] = useState(Boolean(project?.isShared));
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const saveTimer = useRef(null);
  const copyTimer = useRef(null);

  if (!project) {
    return (
      <div className="ma-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4a4960' }}>No project selected.</p>
      </div>
    );
  }

  const memories = project.memories || [];

  useEffect(() => {
    setIsShared(Boolean(project?.isShared));
  }, [project?.isShared]);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(copyTimer.current);
    };
  }, []);

  const showSaved = () => {
    setSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  const updateTitle = (val) => {
    setProject((p) => ({ ...p, title: val }));
    showSaved();
  };

  const updateOwnerName = (val) => {
    setProject((p) => ({ ...p, ownerName: val }));
    showSaved();
  };

  const updateMemory = (id, field, val) => {
    setProject((p) => ({
      ...p,
      memories: (p.memories || []).map((m) =>
        m.id === id ? { ...m, [field]: val } : m
      ),
    }));
    showSaved();
  };

  const addPhoto = async (id, file) => {
    if (!file) return;
    setUploadingPhotoById((prev) => ({ ...prev, [id]: true }));
    try {
      const payload = await uploadPhoto({
        projectId: project?.id,
        memoryId: id,
        photoFile: file,
      });
      if (!payload?.photoUrl) throw new Error('Upload completed but server did not return photoUrl.');
      updateMemory(id, 'photo', payload.photoUrl);
    } catch (error) {
      setVideoUploadError(error?.message || 'Photo upload failed.');
    } finally {
      setUploadingPhotoById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const addVideo = async (id, file) => {
    if (!file) return;
    setVideoUploadError('');
    setUploadingVideoById((prev) => ({ ...prev, [id]: true }));
    try {
      const payload = await uploadMemoryVideo({
        projectId: project?.id,
        memoryId: id,
        videoFile: file,
      });

      if (!payload?.videoUrl || typeof payload.videoUrl !== 'string') {
        throw new Error('Upload completed but server did not return videoUrl.');
      }

      updateMemory(id, 'video', payload.videoUrl);
    } catch (error) {
      setVideoUploadError(error?.message || 'Video upload failed.');
    } finally {
      setUploadingVideoById((prev) => ({ ...prev, [id]: false }));
    }
  };

  const deleteMemory = (id) => {
    setProject((p) => ({
      ...p,
      memories: (p.memories || []).filter((m) => m.id !== id),
    }));
    showSaved();
  };

  const moveMemory = (index, direction) => {
    setProject((p) => {
      const current = [...(p.memories || [])];
      const targetIndex = index + direction;
      if (
        index < 0 ||
        targetIndex < 0 ||
        index >= current.length ||
        targetIndex >= current.length
      ) {
        return p;
      }

      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;

      return { ...p, memories: current };
    });
    showSaved();
  };

  const shareUrl = `${window.location.origin}/view/${project.id}`;

  const handleToggleShare = async () => {
    setShareLoading(true);
    try {
      const result = await toggleShare(project.id, !isShared);
      setIsShared(result.isShared);
    } catch (err) {
      setVideoUploadError(err?.message || 'Failed to update sharing.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const uploadHallProfilePhoto = async (file) => {
    if (!file) return;
    setUploadingHallPhoto(true);
    setVideoUploadError('');
    try {
      const payload = await uploadPhoto({
        projectId: project?.id,
        memoryId: 'hall-profile',
        photoFile: file,
      });
      if (!payload?.photoUrl) throw new Error('Upload completed but server did not return photoUrl.');
      setProject((p) => ({ ...p, hallProfilePhoto: payload.photoUrl }));
      showSaved();
    } catch (err) {
      setVideoUploadError(err?.message || 'Hall photo upload failed.');
    } finally {
      setUploadingHallPhoto(false);
    }
  };

  const MAX_MEMORIES = 8;

  const addMemory = () => {
    if ((project.memories || []).length >= MAX_MEMORIES) return;
    const newMem = {
      id: `mem-${Date.now()}`,
      title: '',
      description: '',
      emotion: '',
      photo: null,
      video: null,
    };
    setProject((p) => ({ ...p, memories: [...(p.memories || []), newMem] }));
  };

  return (
    <div className="ma-page">
      {/* Header */}
      <header className="ma-header">
        <button className="ma-header-brand" onClick={() => navigate('/')}>
          <div className="ma-header-logo">✦</div>
          Memoria
        </button>
        <nav className="ma-header-nav">
          <button
            className="ma-btn ma-btn-ghost ma-btn-sm"
            onClick={() => navigate('/projects')}
          >
            My Projects
          </button>
        </nav>
      </header>

      <div className="ma-detail-body">
        {/* Back */}
        <button className="ma-back-link" onClick={() => navigate('/projects')}>
          ← My Projects
        </button>

        {/* Hero */}
        <div className="ma-detail-hero">
          <input
            className="ma-project-title-input"
            value={project.title || ''}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="Project Name"
          />
          <p className="ma-detail-hero-sub">
            {formatDate(project.createdAt)}
            {memories.length > 0 && ` · ${memories.length} memories`}
          </p>
          <div className="ma-detail-actions">
            <button
              className="ma-btn ma-btn-primary"
              onClick={() => navigate('/interview')}
            >
              🎤 AI Interview
            </button>
            <button
              className="ma-btn ma-btn-accent"
              onClick={() => navigate(project.reviewApprovedAt ? '/memory-hall' : '/review')}
            >
              {project.reviewApprovedAt ? '🧊 Open 3D Room' : '🧊 Review & Generate 3D'}
            </button>
            <button
              className={`ma-btn ${isShared ? 'ma-btn-accent' : 'ma-btn-ghost'}`}
              onClick={handleToggleShare}
              disabled={shareLoading}
            >
              {shareLoading ? '...' : isShared ? '🔗 Shared (click to stop)' : '🔗 Share'}
            </button>
          </div>

          {isShared && (
            <div className="ma-share-row">
              <input
                className="ma-share-input"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
              <button className="ma-btn ma-btn-ghost ma-btn-sm" onClick={handleCopyLink}>
                {shareCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
          )}
        </div>

        <div className="ma-divider" />

        {/* Display Name */}
        <div className="ma-memories-section" style={{ paddingBottom: '8px' }}>
          <div className="ma-memories-header">
            <span className="ma-memories-label">Your Name</span>
          </div>
          <input
            className="ma-project-title-input"
            style={{ fontSize: '14px', marginTop: '8px' }}
            value={project.ownerName || ''}
            onChange={(e) => updateOwnerName(e.target.value)}
            placeholder="Enter your name (shown in 3D room)"
          />
        </div>

        <div className="ma-divider" />

        {/* Hall Profile Photo */}
        <div className="ma-memories-section" style={{ paddingBottom: '8px' }}>
          <div className="ma-memories-header">
            <span className="ma-memories-label">Hall Cover Photo</span>
            <label
              className="ma-btn ma-btn-ghost ma-btn-sm"
              style={{ cursor: uploadingHallPhoto ? 'wait' : 'pointer' }}
              title="Displayed as a large framed photo on the back wall of the 3D hall"
            >
              {uploadingHallPhoto ? 'Uploading…' : project.hallProfilePhoto ? 'Replace' : '+ Upload'}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingHallPhoto}
                onChange={(e) => uploadHallProfilePhoto(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {project.hallProfilePhoto ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginTop: '10px' }}>
              <img
                src={project.hallProfilePhoto}
                alt="Hall cover"
                style={{
                  maxWidth: '180px',
                  maxHeight: '120px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '2px solid rgba(220,170,255,0.3)',
                }}
              />
              <div style={{ color: '#9a88bb', fontSize: '12px', lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>Shown as an embossed gold frame on the back wall of the 3D hall.</p>
                <button
                  className="ma-btn ma-btn-ghost ma-btn-sm"
                  style={{ marginTop: '8px', color: '#b06060' }}
                  onClick={() => { setProject((p) => ({ ...p, hallProfilePhoto: null })); showSaved(); }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: '#7a6a99', fontSize: '13px', margin: '8px 0 0' }}>
              No cover photo yet. Upload one to display it in the 3D hall.
            </p>
          )}
        </div>

        <div className="ma-divider" />

        {/* Memories */}
        <div className="ma-memories-section">
          <div className="ma-memories-header">
            <span className="ma-memories-label">
              Memories
              {memories.length >= MAX_MEMORIES && (
                <span style={{ fontSize: '12px', color: '#a08080', marginLeft: '8px', fontWeight: 400 }}>
                  (max {MAX_MEMORIES})
                </span>
              )}
            </span>
            <button
              className="ma-btn ma-btn-ghost ma-btn-sm"
              onClick={addMemory}
              disabled={memories.length >= MAX_MEMORIES}
              title={memories.length >= MAX_MEMORIES ? `Maximum ${MAX_MEMORIES} memories allowed` : undefined}
            >
              + Add
            </button>
          </div>

          {memories.length === 0 ? (
            <div className="ma-empty">
              <div className="ma-empty-icon">🌙</div>
              <p className="ma-empty-title">ยังไม่มี memories</p>
              <p className="ma-empty-sub">
                เริ่มด้วยการกด AI Interview หรือเพิ่มเองได้เลย
              </p>
            </div>
          ) : (
            <div className="ma-memory-list">
              {memories.map((mem, i) => (
                <div key={mem.id} className="ma-memory-item">
                  {/* Photo slot */}
                  <label className="ma-memory-photo" title="คลิกเพื่อใส่รูป">
                    {uploadingPhotoById[mem.id] ? (
                      <span className="ma-memory-photo-icon">⏳</span>
                    ) : mem.photo ? (
                      <img src={mem.photo} alt="" />
                    ) : (
                      <span className="ma-memory-photo-icon">📸</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={Boolean(uploadingPhotoById[mem.id])}
                      onChange={(e) => addPhoto(mem.id, e.target.files?.[0])}
                    />
                  </label>

                  {/* Video slot */}
                  <label className="ma-memory-photo" title="คลิกเพื่อใส่วิดิโอ" style={{ background: '#1a1428' }}>
                    {mem.video ? (
                      <video
                        src={mem.video}
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                      />
                    ) : (
                      <span className="ma-memory-photo-icon">🎬</span>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      disabled={Boolean(uploadingVideoById[mem.id])}
                      onChange={(e) => addVideo(mem.id, e.target.files?.[0])}
                    />
                  </label>

                  {/* Text fields */}
                  <div className="ma-memory-content">
                    {uploadingVideoById[mem.id] ? (
                      <span className="ma-memory-emotion">Uploading video...</span>
                    ) : null}
                    <input
                      className="ma-memory-title-input"
                      value={mem.title || ''}
                      onChange={(e) =>
                        updateMemory(mem.id, 'title', e.target.value)
                      }
                      placeholder={`Memory ${i + 1}`}
                    />
                    <textarea
                      className="ma-memory-desc-input"
                      value={mem.description || ''}
                      onChange={(e) =>
                        updateMemory(mem.id, 'description', e.target.value)
                      }
                      placeholder="เพิ่มคำอธิบาย..."
                      rows={2}
                    />
                    {mem.emotion && (
                      <span className="ma-memory-emotion">{mem.emotion}</span>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="ma-btn ma-btn-ghost ma-btn-sm"
                        onClick={() => moveMemory(i, -1)}
                        disabled={i === 0}
                        aria-label="Move memory up"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ma-btn ma-btn-ghost ma-btn-sm"
                        onClick={() => moveMemory(i, 1)}
                        disabled={i === memories.length - 1}
                        aria-label="Move memory down"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    className="ma-memory-delete"
                    onClick={() => deleteMemory(mem.id)}
                    title="ลบ"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {videoUploadError ? (
        <div className="ma-save-toast visible" style={{ background: '#8f1d1d' }}>
          {videoUploadError}
        </div>
      ) : null}
      {/* Save toast */}
      <div className={`ma-save-toast ${saved ? 'visible' : ''}`}>✓ บันทึกแล้ว</div>
    </div>
  );
};

export default ProjectDetailPage;

