import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import ViewerPage from './pages/ViewerPage';
import InterviewPage from './pages/InterviewPage';
import MemoryHallPage from './pages/MemoryHallPage';
import { demoProject } from './data/mockProject';

const STORAGE_KEY = 'memoria_projects';
const ACTIVE_KEY  = 'memoria_active_project';

const createEmptyProject = () => ({
  id: `project-${Date.now()}`,
  title: 'New Project',
  coupleNames: '',
  createdAt: new Date().toISOString(),
  photos: [],
  memories: [],
  audioSlots: [],
  textSlots: [],
  roomPayload: null,
  interview: null,
});

const loadProjects = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [{ ...demoProject }];
  } catch {
    return [{ ...demoProject }];
  }
};

const App = () => {
  const [projects, setProjects] = useState(loadProjects);

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || projects[0]?.id || null;
  });

  // Persist to localStorage whenever projects change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(ACTIVE_KEY, activeProjectId);
    }
  }, [activeProjectId]);

  // Derive active project
  const activeProject =
    projects.find((p) => p.id === activeProjectId) ||
    projects[0] ||
    createEmptyProject();

  // Update only the active project
  const setProject = (updater) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? typeof updater === 'function'
            ? updater(p)
            : updater
          : p
      )
    );
  };

  const handleCreateNew = () => {
    const newProject = createEmptyProject();
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const handleSelectProject = (id) => {
    setActiveProjectId(id);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<DashboardPage />} />

        {/* Projects list */}
        <Route
          path="/projects"
          element={
            <ProjectsPage
              projects={projects}
              onCreateNew={handleCreateNew}
              onSelectProject={handleSelectProject}
            />
          }
        />

        {/* Project detail (edit memories, photos) */}
        <Route
          path="/project-detail"
          element={
            <ProjectDetailPage
              project={activeProject}
              setProject={setProject}
            />
          }
        />

        {/* Interview */}
        <Route
          path="/interview"
          element={
            <InterviewPage project={activeProject} setProject={setProject} />
          }
        />

        {/* 3D Memory Hall */}
        <Route
          path="/memory-hall"
          element={<MemoryHallPage project={activeProject} />}
        />

        {/* Legacy / secondary routes */}
        <Route
          path="/upload"
          element={<UploadPage project={activeProject} setProject={setProject} />}
        />
        <Route path="/review"  element={<ReviewPage project={activeProject} />} />
        <Route path="/viewer"  element={<ViewerPage project={activeProject} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
