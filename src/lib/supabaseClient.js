import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const assertSupabaseConfigured = () => {
  if (supabase) return;
  throw new Error(
    "Supabase is not configured. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY."
  );
};

export const getAccessToken = async () => {
  if (!supabase) return "";
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || "";
};
