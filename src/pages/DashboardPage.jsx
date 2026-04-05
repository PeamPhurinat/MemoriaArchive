import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = ({ onSignOut }) => {
  const navigate = useNavigate();

  return (
    <div className="ma-home">
      <div className="ma-home-logo">M</div>
      <h1 className="ma-home-title">Memoria Archive</h1>
      <p className="ma-home-sub">
        Preserve your memories in a 3D world through AI conversation
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
    </div>
  );
};

export default DashboardPage;
