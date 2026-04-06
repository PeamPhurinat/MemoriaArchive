import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CARD_ICONS = ['🧠', '💫', '🌙', '✨', '🎞', '🌸', '🗝', '🪐'];

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const memoryCount = (p) =>
  p.memories?.length || p.textSlots?.length || 0;

const ProjectsPage = ({ projects, onCreateNew, onSelectProject, onDeleteProject, loading, syncError }) => {
  const navigate = useNavigate();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = (e) => {
    e.stopPropagation();
    onDeleteProject(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const openProject = (id) => {
    onSelectProject(id);
    navigate('/project-detail');
  };

  const goInterview = (id, e) => {
    e.stopPropagation();
    onSelectProject(id);
    navigate('/interview');
  };

  const go3D = (id, e) => {
    e.stopPropagation();
    onSelectProject(id);
    const selected = projects.find((project) => project.id === id);
    navigate(selected?.reviewApprovedAt ? '/memory-hall' : '/review');
  };

  const handleCreateNew = () => {
    onCreateNew();
    navigate('/project-detail');
  };

  return (
    <div className="ma-page">
      {/* Header */}
      <header className="ma-header">
        <button className="ma-header-brand" onClick={() => navigate('/')}>
          <div className="ma-header-logo">✦</div>
          Memoria
        </button>
      </header>

      <div className="ma-projects-body">
        <div className="ma-section-header">
          <h1 className="ma-section-title">My Projects</h1>
          <button className="ma-btn ma-btn-primary ma-btn-sm" onClick={handleCreateNew}>
            + New Project
          </button>
        </div>

        <div className="ma-projects-grid">
          {loading ? (
            <div className="ma-project-card-new" style={{ minHeight: '160px' }}>
              <span>Loading projects...</span>
            </div>
          ) : null}
          {syncError ? (
            <div className="ma-project-card-new" style={{ minHeight: '160px', color: '#7a1f1f' }}>
              <span>{syncError}</span>
            </div>
          ) : null}
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="ma-project-card"
              onClick={() => openProject(p.id)}
            >
              <div className="ma-project-card-glow" />
              <div className="ma-project-card-icon">
                {CARD_ICONS[i % CARD_ICONS.length]}
              </div>
              <div className="ma-project-card-title">
                {p.title || 'Untitled Project'}
                {p.id === 'demo-project' && (
                  <span className="ma-badge">Demo</span>
                )}
              </div>
              <div className="ma-project-card-meta">{formatDate(p.createdAt)}</div>
              <div className="ma-project-card-stats">
                <span className="ma-stat-pill">
                  💬 {memoryCount(p)} memories
                </span>
                {p.interview && (
                  <span className="ma-stat-pill">🎤 interviewed</span>
                )}
              </div>
              <div className="ma-project-card-actions">
                <button
                  className="ma-btn ma-btn-ghost ma-btn-sm"
                  onClick={(e) => { e.stopPropagation(); openProject(p.id); }}
                >
                  Open
                </button>
                <button
                  className="ma-btn ma-btn-ghost ma-btn-sm"
                  onClick={(e) => goInterview(p.id, e)}
                >
                  🎤 Interview
                </button>
                <button
                  className="ma-btn ma-btn-ghost ma-btn-sm"
                  onClick={(e) => go3D(p.id, e)}
                >
                  {p.reviewApprovedAt ? '🧊 Open 3D Room' : '🧊 Review → 3D'}
                </button>
              </div>

              {/* Delete — shown as confirm step to prevent accidents */}
              <div
                style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={(e) => e.stopPropagation()}
              >
                {confirmDeleteId === p.id ? (
                  <>
                    <span style={{ fontSize: '12px', color: '#c07070' }}>Delete this project?</span>
                    <button
                      className="ma-btn ma-btn-sm"
                      style={{ background: 'rgba(160,40,40,0.75)', color: '#fff', border: 'none' }}
                      onClick={confirmDelete}
                    >
                      Yes, delete
                    </button>
                    <button
                      className="ma-btn ma-btn-ghost ma-btn-sm"
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="ma-btn ma-btn-ghost ma-btn-sm"
                    style={{ color: '#8a5555', fontSize: '12px' }}
                    onClick={(e) => handleDeleteClick(p.id, e)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* New project slot */}
          <div className="ma-project-card-new" onClick={handleCreateNew}>
            <div className="ma-project-card-new-icon">+</div>
            <span>New Project</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
