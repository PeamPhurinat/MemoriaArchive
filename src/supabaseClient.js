import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function saveLayoutToCloud(userId, payload) {
  if (!supabase) {
    return { ok: false, reason: "not_configured" };
  }

  const record = {
    user_id: userId,
    layout_data: payload,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_layouts")
    .upsert(record, { onConflict: "user_id" });

  if (error) {
    console.error("Supabase save error:", error.message);
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

export async function loadLayoutFromCloud(userId) {
  if (!supabase) {
    return { ok: false, payload: null, reason: "not_configured" };
  }

  const { data, error } = await supabase
    .from("user_layouts")
    .select("layout_data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase load error:", error.message);
    return { ok: false, payload: null, reason: error.message };
  }

  return { ok: true, payload: data?.layout_data ?? null };
}
