const {
  assertSupabaseConfigured,
  supabaseAdmin
} = require("../services/supabaseAdminClient");
const { sanitizeProjectId } = require("./projectRepository");

const readLayout = async (userId, projectId) => {
  assertSupabaseConfigured();
  const cleanProjectId = sanitizeProjectId(projectId);

  const { data, error } = await supabaseAdmin
    .from("user_layouts")
    .select("theme, components, layout_data")
    .eq("user_id", userId)
    .eq("project_id", cleanProjectId)
    .maybeSingle();

  if (error) {
    const wrapped = new Error(`Failed to load layout: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  if (!data) return null;

  // Merge explicit columns back into layout_data so the client payload is complete
  return {
    ...data.layout_data,
    themeKey: data.theme || data.layout_data?.themeKey || "dream",
    components: data.components || data.layout_data?.components || {},
  };
};

const upsertLayout = async (userId, projectId, layout) => {
  assertSupabaseConfigured();
  const cleanProjectId = sanitizeProjectId(projectId);
  const payload = layout && typeof layout === "object" ? layout : {};

  const theme =
    typeof payload.themeKey === "string" && payload.themeKey.trim()
      ? payload.themeKey.trim()
      : "dream";
  const components =
    payload.components && typeof payload.components === "object"
      ? payload.components
      : {};

  const { data, error } = await supabaseAdmin
    .from("user_layouts")
    .upsert(
      {
        user_id: userId,
        project_id: cleanProjectId,
        theme,
        components,
        layout_data: payload,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,project_id" }
    )
    .select("theme, components, layout_data")
    .maybeSingle();

  if (error) {
    const wrapped = new Error(`Failed to save layout: ${error.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  return {
    ...((data?.layout_data) ?? payload),
    themeKey: data?.theme || theme,
    components: data?.components || components,
  };
};

// Read layout for a shared project — finds the owner's layout by joining with projects
const readPublicLayout = async (projectId) => {
  assertSupabaseConfigured();
  const cleanProjectId = sanitizeProjectId(projectId);

  // First confirm the project is actually shared and get its owner
  const { data: projectRow, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("user_id")
    .eq("id", cleanProjectId)
    .eq("is_shared", true)
    .maybeSingle();

  if (projectError) {
    const wrapped = new Error(`Failed to verify project: ${projectError.message}`);
    wrapped.status = 500;
    throw wrapped;
  }

  if (!projectRow) return null;

  return readLayout(projectRow.user_id, cleanProjectId);
};

module.exports = {
  readLayout,
  readPublicLayout,
  upsertLayout
};
