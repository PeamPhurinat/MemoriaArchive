import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const saveTimer = useRef(null);

  if (!project) {
    return (
      <div className="ma-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#4a4960' }}>No project selected.</p>
      </div>
    );
  }

  const memories = project.memories || [];

  const showSaved = () => {
    setSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 1800);
  };

  const updateTitle = (val) => {
    setProject((p) => ({ ...p, title: val }));
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

  const addPhoto = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => updateMemory(id, 'photo', e.target.result);
    reader.readAsDataURL(file);
  };

  const deleteMemory = (id) => {
    setProject((p) => ({
      ...p,
      memories: (p.memories || []).filter((m) => m.id !== id),
    }));
    showSaved();
  };

  const addMemory = () => {
    const newMem = {
      id: `mem-${Date.now()}`,
      title: '',
      description: '',
      emotion: '',
      photo: null,
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
          </div>
        </div>

        <div className="ma-divider" />

        {/* Memories */}
        <div className="ma-memories-section">
          <div className="ma-memories-header">
            <span className="ma-memories-label">Memories</span>
            <button className="ma-btn ma-btn-ghost ma-btn-sm" onClick={addMemory}>
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
                    {mem.photo ? (
                      <img src={mem.photo} alt="" />
                    ) : (
                      <span className="ma-memory-photo-icon">📸</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => addPhoto(mem.id, e.target.files?.[0])}
                    />
                  </label>

                  {/* Text fields */}
                  <div className="ma-memory-content">
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

      {/* Save toast */}
      <div className={`ma-save-toast ${saved ? 'visible' : ''}`}>✓ บันทึกแล้ว</div>
    </div>
  );
};

export default ProjectDetailPage;
