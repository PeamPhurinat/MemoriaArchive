const { authBypassUserId } = require("../config/env");
const {
  supabaseAdmin,
  assertSupabaseConfigured
} = require("../services/supabaseAdminClient");

const parseBearerToken = (headerValue) => {
  const value = String(headerValue || "").trim();
  if (!value.toLowerCase().startsWith("bearer ")) return "";
  return value.slice("bearer ".length).trim();
};

const requireAuth = async (req, res, next) => {
  try {
    if (authBypassUserId) {
      req.user = {
        id: authBypassUserId,
        email: ""
      };
      return next();
    }

    assertSupabaseConfigured();
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Missing Authorization header."
      });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user?.id) {
      return res.status(401).json({
        ok: false,
        error: "Invalid or expired access token."
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || ""
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requireAuth
};
