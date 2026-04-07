/**
 * Unit tests for projectController.js
 * Tests request handling for project CRUD operations.
 * Repository layer is fully mocked.
 */

jest.mock('../../../server/src/repositories/projectRepository', () => ({
  createDefaultProjectData: jest.fn(),
  deleteProject: jest.fn(),
  listProjects: jest.fn(),
  readProject: jest.fn(),
  sanitizeProjectId: jest.fn(),
  writeProject: jest.fn(),
}));

const {
  createProject,
  deleteUserProject,
  getProject,
  listUserProjects,
  upsertProject,
} = require('../../../server/src/controllers/projectController');

const {
  createDefaultProjectData,
  deleteProject,
  listProjects,
  readProject,
  sanitizeProjectId,
  writeProject,
} = require('../../../server/src/repositories/projectRepository');

// Helpers to build Express-like req/res mocks
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  user: { id: 'user-abc', email: 'test@example.com' },
  params: {},
  body: {},
  ...overrides,
});

describe('projectController', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
    sanitizeProjectId.mockImplementation((id) => String(id || 'sanitized-id'));
  });

  // ─── listUserProjects ────────────────────────────────────────────────────────

  describe('listUserProjects', () => {
    test('should respond 200 with the projects array', async () => {
      const fakeProjects = [{ id: 'p1', title: 'Trip' }, { id: 'p2', title: 'Wedding' }];
      listProjects.mockResolvedValue(fakeProjects);

      const req = mockReq();
      const res = mockRes();

      await listUserProjects(req, res, next);

      expect(listProjects).toHaveBeenCalledWith('user-abc');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true, projects: fakeProjects });
    });

    test('should call next with error when listProjects throws', async () => {
      const error = new Error('DB failure');
      listProjects.mockRejectedValue(error);

      const req = mockReq();
      const res = mockRes();

      await listUserProjects(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── getProject ─────────────────────────────────────────────────────────────

  describe('getProject', () => {
    test('should respond 200 with the requested project', async () => {
      const fakeProject = { id: 'p1', title: 'Holiday' };
      readProject.mockResolvedValue(fakeProject);

      const req = mockReq({ params: { projectId: 'p1' } });
      const res = mockRes();

      await getProject(req, res, next);

      expect(readProject).toHaveBeenCalledWith('user-abc', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true, project: fakeProject });
    });

    test('should call next with error when readProject throws', async () => {
      const error = new Error('Not found');
      readProject.mockRejectedValue(error);

      const req = mockReq({ params: { projectId: 'missing' } });
      const res = mockRes();

      await getProject(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── createProject ───────────────────────────────────────────────────────────

  describe('createProject', () => {
    test('should respond 201 with the created project', async () => {
      const fakeProject = { id: 'new-proj', title: 'New Project' };
      createDefaultProjectData.mockReturnValue({ title: 'New Project', memories: [] });
      writeProject.mockResolvedValue(fakeProject);

      const req = mockReq({
        body: { project: { id: 'new-proj', title: 'New Project' } },
      });
      const res = mockRes();

      await createProject(req, res, next);

      expect(writeProject).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ok: true, project: fakeProject });
    });

    test('should call next with error when writeProject throws', async () => {
      const error = new Error('Write failed');
      createDefaultProjectData.mockReturnValue({});
      writeProject.mockRejectedValue(error);

      const req = mockReq({ body: { project: { id: 'bad-proj' } } });
      const res = mockRes();

      await createProject(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should handle empty body gracefully', async () => {
      createDefaultProjectData.mockReturnValue({ title: 'New Project' });
      writeProject.mockResolvedValue({ id: 'auto-id', title: 'New Project' });

      const req = mockReq({ body: {} });
      const res = mockRes();

      await createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ─── upsertProject ───────────────────────────────────────────────────────────

  describe('upsertProject', () => {
    test('should respond 200 with the updated project', async () => {
      const updatedProject = { id: 'p1', title: 'Updated Title' };
      writeProject.mockResolvedValue(updatedProject);

      const req = mockReq({
        params: { projectId: 'p1' },
        body: { project: { title: 'Updated Title' } },
      });
      const res = mockRes();

      await upsertProject(req, res, next);

      expect(writeProject).toHaveBeenCalledWith(
        'user-abc',
        expect.any(String),
        expect.objectContaining({ title: 'Updated Title' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true, project: updatedProject });
    });

    test('should inject updatedAt timestamp into the payload', async () => {
      writeProject.mockResolvedValue({ id: 'p1' });

      const req = mockReq({
        params: { projectId: 'p1' },
        body: { project: { title: 'Test' } },
      });
      const res = mockRes();

      await upsertProject(req, res, next);

      const savedPayload = writeProject.mock.calls[0][2];
      expect(savedPayload).toHaveProperty('updatedAt');
      expect(typeof savedPayload.updatedAt).toBe('string');
    });

    test('should call next with error when writeProject throws', async () => {
      const error = new Error('Save failed');
      writeProject.mockRejectedValue(error);

      const req = mockReq({
        params: { projectId: 'p1' },
        body: { project: {} },
      });
      const res = mockRes();

      await upsertProject(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── deleteUserProject ───────────────────────────────────────────────────────

  describe('deleteUserProject', () => {
    test('should respond 200 with ok:true on successful deletion', async () => {
      deleteProject.mockResolvedValue(undefined);

      const req = mockReq({ params: { projectId: 'p1' } });
      const res = mockRes();

      await deleteUserProject(req, res, next);

      expect(deleteProject).toHaveBeenCalledWith('user-abc', expect.any(String));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test('should call next with error when deleteProject throws', async () => {
      const error = new Error('Delete failed');
      deleteProject.mockRejectedValue(error);

      const req = mockReq({ params: { projectId: 'ghost' } });
      const res = mockRes();

      await deleteUserProject(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
