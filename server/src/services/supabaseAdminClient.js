const { createClient } = require("@supabase/supabase-js");
const {
  supabaseUrl,
  supabaseServiceRoleKey
} = require("../config/env");

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

const assertSupabaseConfigured = () => {
  if (supabaseAdmin) return;
  const error = new Error(
    "Supabase server credentials are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  error.status = 500;
  throw error;
};

module.exports = {
  isSupabaseConfigured,
  supabaseAdmin,
  assertSupabaseConfigured
};
