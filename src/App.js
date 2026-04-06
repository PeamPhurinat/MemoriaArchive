import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import UploadPage from "./pages/UploadPage";
import ReviewPage from "./pages/ReviewPage";
import ViewerPage from "./pages/ViewerPage";
import InterviewPage from "./pages/InterviewPage";
import MemoryHallPage from "./pages/MemoryHallPage";
import SharedViewPage from "./pages/SharedViewPage";
import AuthPage from "./pages/AuthPage";
import { useAuth } from "./context/AuthContext";
import {
  createProject as createProjectApi,
  listProjects as listProjectsApi,
  saveProject as saveProjectApi,
  deleteProject as deleteProjectApi,
} from "./services/projectApi";

const ACTIVE_KEY = "memoria_active_project";

const createProjectId = () => {
  const hasRandomUuid =
    typeof window !== "undefined" &&
    window.crypto &&
    typeof window.crypto.randomUUID === "function";
  const randomPart = hasRandomUuid
    ? window.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `project-${Date.now()}-${randomPart}`;
};

const createEmptyProject = () => {
  const now = new Date().toISOString();
  return {
    id: createProjectId(),
    title: "New Project",
    coupleNames: "",
    createdAt: now,
    updatedAt: now,
    photos: [],
    memories: [],
    audioSlots: [],
    photoSlots: [],
    textSlots: [],
    roomPayload: null,
    interview: null,
    reviewApprovedAt: null
  };
};

const normalizeProject = (project) => {
  const fallback = createEmptyProject();
  const source = project && typeof project === "object" ? project : {};
  return {
    ...fallback,
    ...source,
    id: String(source.id || fallback.id),
    title: typeof source.title === "string" ? source.title : fallback.title,
    coupleNames: typeof source.coupleNames === "string" ? source.coupleNames : "",
    createdAt: source.createdAt || fallback.createdAt,
    updatedAt: source.updatedAt || source.createdAt || fallback.updatedAt,
    photos: Array.isArray(source.photos) ? source.photos : [],
    memories: Array.isArray(source.memories) ? source.memories : [],
    audioSlots: Array.isArray(source.audioSlots) ? source.audioSlots : [],
    photoSlots: Array.isArray(source.photoSlots) ? source.photoSlots : [],
    textSlots: Array.isArray(source.textSlots) ? source.textSlots : [],
    roomPayload: source.roomPayload && typeof source.roomPayload === "object"
      ? source.roomPayload
      : null,
    interview: source.interview && typeof source.interview === "object"
      ? source.interview
      : null,
    reviewApprovedAt: source.reviewApprovedAt || null,
    isShared: Boolean(source.isShared),
  };
};

const FullscreenMessage = ({ message }) => (
  <div className="ma-auth-page">
    <div className="ma-auth-card">{message}</div>
  </div>
);

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <FullscreenMessage message="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { loading, isAuthenticated, signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectSyncError, setProjectSyncError] = useState("");
  const saveTimersRef = useRef(new Map());
  const [activeProjectId, setActiveProjectId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => () => {
    saveTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    saveTimersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      setActiveProjectId(null);
      setProjectSyncError("");
      saveTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      saveTimersRef.current.clear();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const loadProjects = async () => {
      setProjectsLoading(true);
      setProjectSyncError("");

      try {
        const fetchedProjects = await listProjectsApi();
        if (cancelled) return;

        const normalized = fetchedProjects.map(normalizeProject);
        if (normalized.length > 0) {
          setProjects(normalized);

          const savedActiveId = localStorage.getItem(ACTIVE_KEY);
          const targetActive = normalized.find((project) => project.id === savedActiveId)
            ? savedActiveId
            : normalized[0].id;
          setActiveProjectId(targetActive);
          return;
        }

        const firstProject = normalizeProject(createEmptyProject());
        setProjects([firstProject]);
        setActiveProjectId(firstProject.id);

        try {
          const created = await createProjectApi(firstProject);
          if (cancelled || !created) return;
          const normalizedCreated = normalizeProject(created);
          setProjects([normalizedCreated]);
          setActiveProjectId(normalizedCreated.id);
        } catch (createError) {
          if (!cancelled) {
            setProjectSyncError(createError.message || "Failed to create first project.");
          }
        }
      } catch (error) {
        if (!cancelled) {
          setProjectSyncError(error.message || "Failed to load projects from database.");
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeProjectId) return;
    localStorage.setItem(ACTIVE_KEY, activeProjectId);
  }, [activeProjectId, isAuthenticated]);

  const scheduleProjectSave = useCallback(
    (project) => {
      if (!isAuthenticated) return;

      const normalized = normalizeProject(project);
      const existing = saveTimersRef.current.get(normalized.id);
      if (existing) {
        clearTimeout(existing);
      }

      const timerId = setTimeout(async () => {
        saveTimersRef.current.delete(normalized.id);
        try {
          const saved = await saveProjectApi(normalized);
          if (!saved) return;
          const normalizedSaved = normalizeProject(saved);
          setProjects((prev) =>
            prev.map((item) => (item.id === normalizedSaved.id ? normalizedSaved : item))
          );
        } catch (error) {
          setProjectSyncError(error.message || "Failed to sync project to database.");
        }
      }, 450);

      saveTimersRef.current.set(normalized.id, timerId);
    },
    [isAuthenticated]
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) || projects[0] || null,
    [activeProjectId, projects]
  );

  const setProject = useCallback(
    (updater) => {
      if (!activeProject) return;

      setProjects((prev) =>
        prev.map((project) => {
          if (project.id !== activeProject.id) return project;

          const candidate =
            typeof updater === "function" ? updater(project) : updater;
          if (!candidate || typeof candidate !== "object") return project;

          const nextProject = normalizeProject({
            ...candidate,
            id: project.id,
            createdAt: project.createdAt
          });

          scheduleProjectSave(nextProject);
          return nextProject;
        })
      );
    },
    [activeProject, scheduleProjectSave]
  );

  const handleCreateNew = useCallback(() => {
    const draft = normalizeProject(createEmptyProject());
    setProjects((prev) => [...prev, draft]);
    setActiveProjectId(draft.id);

    createProjectApi(draft)
      .then((saved) => {
        if (!saved) return;
        const normalizedSaved = normalizeProject(saved);
        setProjects((prev) =>
          prev.map((project) => (project.id === draft.id ? normalizedSaved : project))
        );
      })
      .catch((error) => {
        setProjectSyncError(error.message || "Failed to create project.");
      });
  }, []);

  const handleSelectProject = useCallback((id) => {
    setActiveProjectId(id);
  }, []);

  const handleDeleteProject = useCallback((id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProjectId((prev) => {
      if (prev !== id) return prev;
      const remaining = projects.filter((p) => p.id !== id);
      return remaining[0]?.id || null;
    });
    deleteProjectApi(id).catch((err) => {
      setProjectSyncError(err.message || "Failed to delete project.");
    });
  }, [projects]);

  if (loading) {
    return <FullscreenMessage message="Loading authentication..." />;
  }

  const renderActiveProjectPage = (page) => {
    if (projectsLoading && !activeProject) {
      return <FullscreenMessage message="Loading projects..." />;
    }
    if (!activeProject) {
      return <Navigate to="/projects" replace />;
    }
    return page;
  };

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage onSignOut={signOut} />
          </RequireAuth>
        }
      />

      <Route
        path="/projects"
        element={
          <RequireAuth>
            <ProjectsPage
              projects={projects}
              onCreateNew={handleCreateNew}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              loading={projectsLoading}
              syncError={projectSyncError}
            />
          </RequireAuth>
        }
      />

      <Route
        path="/project-detail"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              <ProjectDetailPage project={activeProject} setProject={setProject} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/interview"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              <InterviewPage project={activeProject} setProject={setProject} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/memory-hall"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              activeProject?.reviewApprovedAt
                ? <MemoryHallPage project={activeProject} />
                : <Navigate to="/review" replace />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/upload"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              <UploadPage project={activeProject} setProject={setProject} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/review"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              <ReviewPage project={activeProject} setProject={setProject} />
            )}
          </RequireAuth>
        }
      />

      <Route
        path="/viewer"
        element={
          <RequireAuth>
            {renderActiveProjectPage(
              activeProject?.reviewApprovedAt
                ? <ViewerPage project={activeProject} />
                : <Navigate to="/review" replace />
            )}
          </RequireAuth>
        }
      />

      <Route path="/view/:projectId" element={<SharedViewPage />} />

      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
