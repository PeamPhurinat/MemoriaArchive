import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = ({ onCreateNew, onOpenDemo, onStartInterview }) => {
  const navigate = useNavigate();
  return (
  <div className="app-shell">
    <h1 className="page-title">Memoria Archive - 3D Memory Room</h1>
    <p className="page-subtitle">
      Start a new memory room or explore a prefilled demo project.
    </p>
    <div className="section">
      <div className="button-row">
        <button className="button primary" onClick={onCreateNew} type="button">
          Create New Project
        </button>
        <button className="button" onClick={onOpenDemo} type="button">
          Open Demo Project
        </button>
        <button className="button" onClick={onStartInterview} type="button">
          Start AI Interview (Single User)
        </button>
        <button className="button" onClick={() => navigate('/memory-hall')} type="button">
          Open 3D Memory Hall
        </button>
      </div>
    </div>
  </div>
  );
};

export default DashboardPage;
