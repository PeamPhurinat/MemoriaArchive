import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = ({ onSignOut }) => {
  const navigate = useNavigate();

  return (
    <div className="ma-home">
      <div className="ma-home-orb ma-home-orb-left" aria-hidden="true" />
      <div className="ma-home-orb ma-home-orb-right" aria-hidden="true" />
      <div className="ma-home-content">
        <div className="ma-home-logo">✦</div>
        <h1 className="ma-home-title">Memoria Archive</h1>
        <p className="ma-home-sub">
          Preserve your memories in a 3D world through conversations with AI.
        </p>
        <div className="ma-home-actions">
          <button
            className="ma-btn ma-btn-primary ma-btn-lg"
            onClick={() => navigate('/projects')}
          >
            My Projects
          </button>
          {typeof onSignOut === 'function' ? (
            <button
              className="ma-btn ma-btn-ghost ma-btn-lg"
              onClick={onSignOut}
            >
              Sign Out
            </button>
          ) : null}
        </div>

        <div className="ma-home-feature-row" aria-hidden="true">
          <article className="ma-home-feature">
            <h3>Voice Interview</h3>
            <p>Capture nuanced stories through guided prompts.</p>
          </article>
          <article className="ma-home-feature">
            <h3>Memory Curation</h3>
            <p>Organize photos, text, and media in one archive.</p>
          </article>
          <article className="ma-home-feature">
            <h3>3D Experience</h3>
            <p>Transform moments into an explorable memory hall.</p>
          </article>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
