/**
 * Unit tests for authMiddleware.js
 * Tests the requireAuth middleware including token parsing,
 * Supabase validation, and the development bypass mode.
 */

// Mock with a factory so supabaseAdmin is an object (not null) even without env vars
jest.mock('../../../server/src/services/supabaseAdminClient', () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
  },
  assertSupabaseConfigured: jest.fn(),
}));

jest.mock('../../../server/src/config/env', () => ({
  authBypassUserId: null,
}));

const {
  supabaseAdmin,
  assertSupabaseConfigured,
} = require('../../../server/src/services/supabaseAdminClient');
const { requireAuth } = require('../../../server/src/middleware/authMiddleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware › requireAuth', () => {
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  test('should call next() and set req.user when a valid Bearer token is provided', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'user@example.com' } },
      error: null,
    });

    const req = { headers: { authorization: 'Bearer valid-token' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'user-123', email: 'user@example.com' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 401 when Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.stringContaining('Missing') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when token does not start with "Bearer "', async () => {
    const req = { headers: { authorization: 'Token some-other-scheme' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when Supabase returns an error', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    });

    const req = { headers: { authorization: 'Bearer expired-token' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: expect.stringContaining('Invalid') })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 when Supabase returns a user without an id', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { email: 'ghost@example.com' } }, // no id
      error: null,
    });

    const req = { headers: { authorization: 'Bearer token-without-user-id' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should call next(error) when Supabase getUser throws unexpectedly', async () => {
    supabaseAdmin.auth.getUser.mockRejectedValue(new Error('Supabase is down'));

    const req = { headers: { authorization: 'Bearer some-token' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should bypass Supabase and call next() when authBypassUserId is set', async () => {
    // authBypassUserId is destructured in the middleware at import time,
    // so we test bypass by re-requiring the module with a new mock.
    jest.resetModules();
    jest.mock('../../../server/src/config/env', () => ({
      authBypassUserId: 'dev-bypass-user',
    }));
    jest.mock('../../../server/src/services/supabaseAdminClient', () => ({
      supabaseAdmin: { auth: { getUser: jest.fn() } },
      assertSupabaseConfigured: jest.fn(),
    }));

    const { requireAuth: bypassAuth } = require('../../../server/src/middleware/authMiddleware');
    const bypassNext = jest.fn();
    const req = { headers: {} };
    const res = mockRes();

    await bypassAuth(req, res, bypassNext);

    expect(bypassNext).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'dev-bypass-user', email: '' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should strip Bearer prefix and pass only the token to Supabase', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
      error: null,
    });

    const req = { headers: { authorization: 'Bearer   trimmed-token  ' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    const passedToken = supabaseAdmin.auth.getUser.mock.calls[0][0];
    expect(passedToken).not.toContain('Bearer');
  });

  test('should call assertSupabaseConfigured before checking the token', async () => {
    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
      error: null,
    });

    const req = { headers: { authorization: 'Bearer tok' } };
    const res = mockRes();

    await requireAuth(req, res, next);

    expect(assertSupabaseConfigured).toHaveBeenCalledTimes(1);
  });
});
