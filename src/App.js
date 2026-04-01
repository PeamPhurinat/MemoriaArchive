import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ViewerPage from './pages/ViewerPage';
import InterviewPage from './pages/InterviewPage';
import MemoryHallPage from './pages/MemoryHallPage';
import { demoProject } from './data/mockProject';

const createEmptyProject = () => ({
  id: `project-${Date.now()}`,
  title: '',
  coupleNames: '',
  createdAt: new Date().toISOString(),
  photos: [],
  memories: [],
  audioSlots: [],
  textSlots: [],
  roomPayload: null,
  interview: null
});

const DashboardRoute = ({ onCreateNew, onOpenDemo, onStartInterview }) => {
  const navigate = useNavigate();

  return (
    <DashboardPage
      onCreateNew={() => {
        onCreateNew();
        navigate('/upload');
      }}
      onOpenDemo={() => {
        onOpenDemo();
        navigate('/upload');
      }}
      onStartInterview={() => {
        onStartInterview();
        navigate('/interview');
      }}
    />
  );
};

const App = () => {
  // Store all project data in React state for the prototype.
  const [project, setProject] = useState(() => createEmptyProject());

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardRoute
              onCreateNew={() => setProject(createEmptyProject())}
              onOpenDemo={() => setProject(demoProject)}
              onStartInterview={() => setProject(createEmptyProject())}
            />
          }
        />
        <Route
          path="/interview"
          element={<InterviewPage project={project} setProject={setProject} />}
        />
        <Route
          path="/upload"
          element={<UploadPage project={project} setProject={setProject} />}
        />
        <Route path="/review" element={<ReviewPage project={project} />} />
        <Route path="/viewer" element={<ViewerPage project={project} />} />
        <Route path="/memory-hall" element={<MemoryHallPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
