import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <div className="ma-home">
      <div className="ma-home-logo">✦</div>
      <h1 className="ma-home-title">Memoria Archive</h1>
      <p className="ma-home-sub">
        เก็บความทรงจำไว้ในโลก 3D ด้วยการสนทนากับ AI
      </p>
      <div className="ma-home-actions">
        <button
          className="ma-btn ma-btn-primary ma-btn-lg"
          onClick={() => navigate('/projects')}
        >
          ✦ My Projects
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
