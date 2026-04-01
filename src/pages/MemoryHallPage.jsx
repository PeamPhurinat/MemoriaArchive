import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initMemoryHall } from '../3d-hall/memoryHallScene';
import '../3d-hall/style.css';

const MemoryHallPage = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cleanup = initMemoryHall(container);
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div ref={containerRef} className="memory-hall-root">
      <div className="mh-overlay">
        <section className="mh-title-card">
          <p className="mh-eyebrow">Memoria Prototype</p>
          <h1>Dream Archive Realm</h1>
          <p>
            A drifting timeline of memories arranged left and right through the
            dream realm. Follow photos, written descriptions, and floating voice
            clouds step by step through the archive.
          </p>
        </section>
        <button className="mh-launch" type="button">Enter the realm</button>
        <button className="mh-back-btn" type="button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <button className="mh-mode-toggle" type="button" aria-pressed="false">
          Switch to Custom Mode
        </button>
        <section className="mh-controls">
          <p>
            View mode: move with W A S D and look with the mouse. Custom mode: click memory
            stations to move, resize, or delete them, then save each user layout. Press Esc
            to unlock. Use the VR button when WebXR is available.
          </p>
        </section>
        <section className="mh-custom-panel" aria-live="polite">
          <p className="mh-custom-title">Memory Layout Customizer</p>
          <label className="mh-custom-label" htmlFor="custom-user-id">User ID</label>
          <input
            id="custom-user-id"
            className="mh-custom-user-input"
            type="text"
            maxLength="32"
            placeholder="guest"
          />
          <div className="mh-custom-actions">
            <button className="mh-tool-move is-active" type="button">Move</button>
            <button className="mh-tool-resize" type="button">Resize</button>
            <button className="mh-tool-delete" type="button">Delete Selected</button>
          </div>
          <label className="mh-custom-label" htmlFor="custom-scale">Scale</label>
          <div className="mh-custom-scale-row">
            <input
              id="custom-scale"
              className="mh-custom-scale"
              type="range"
              min="0.35"
              max="3"
              step="0.01"
              defaultValue="1"
            />
            <span className="mh-custom-scale-value">100%</span>
          </div>
          <div className="mh-custom-actions">
            <button className="mh-tool-save" type="button">Save Layout</button>
            <button className="mh-tool-load" type="button">Load Layout</button>
            <button className="mh-tool-reset" type="button">Reset Layout</button>
          </div>
          <p className="mh-custom-hint">
            Tip: press E for move, R for resize, and Delete to remove selected memory.
          </p>
          <p className="mh-custom-status">View mode enabled.</p>
        </section>
        <div className="mh-reticle" aria-hidden="true"></div>
      </div>
    </div>
  );
};

export default MemoryHallPage;
