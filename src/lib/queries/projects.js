
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient()
// ─── CLIENT: Fetch own projects ───
export async function fetchClientProjects(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── CONTRACTOR: Fetch assigned projects ───
// Queries project_assignments (new) and legacy contractor_id, deduplicates results.
// Attaches my_role (offline_editor | primary_editor | finishing_editor | null) to each project.
export async function fetchContractorProjects(userId) {
  const [assignResult, legacyResult] = await Promise.allSettled([
    supabase.from("project_assignments").select("project_id, role").eq("contractor_id", userId),
    supabase.from("projects").select("id").eq("contractor_id", userId),
  ]);

  const projectIds = new Set();
  const roleMap = new Map(); // project_id → role

  if (assignResult.status === "fulfilled" && !assignResult.value.error) {
    (assignResult.value.data || []).forEach((r) => {
      projectIds.add(r.project_id);
      roleMap.set(r.project_id, r.role);
    });
  }
  if (legacyResult.status === "fulfilled" && !legacyResult.value.error) {
    (legacyResult.value.data || []).forEach((r) => projectIds.add(r.id));
  }


  if (projectIds.size === 0) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(`*, client:profiles!client_id(id, name, email, avatar_url)`)
    .in("id", [...projectIds])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((p) => ({ ...p, my_role: roleMap.get(p.id) || null }));
}

// ─── ADMIN: Fetch all projects ───
export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:profiles!client_id(id, name, email, avatar_url),
      contractor:profiles!contractor_id(id, name, email, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── ALL ROLES: Fetch single project with details ───
export async function fetchProjectById(id) {
  // Try with project_assignments first; fallback if table doesn't exist yet
  let { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:profiles!client_id(id, name, email, avatar_url),
      contractor:profiles!contractor_id(id, name, email, avatar_url),
      assignments:project_assignments(
        id, role, contractor_id,
        contractor:profiles!contractor_id(id, name, email, avatar_url)
      ),
      comments:project_comments(
        id, content, timecode, project_version_id, created_at,
        author:profiles!author_id(id, name, avatar_url, role)
      ),
      versions:project_versions(
        id, version_number, video_url, notes, status, created_at,
        uploader:profiles!uploaded_by(id, name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    ({ data, error } = await supabase
      .from("projects")
      .select(`
        *,
        client:profiles!client_id(id, name, email, avatar_url),
        contractor:profiles!contractor_id(id, name, email, avatar_url),
        comments:project_comments(
          id, content, timecode, project_version_id, created_at,
          author:profiles!author_id(id, name, avatar_url, role)
        ),
        versions:project_versions(
          id, version_number, video_url, notes, status, created_at,
          uploader:profiles!uploaded_by(id, name, avatar_url)
        )
      `)
      .eq("id", id)
      .single());
    if (error) throw error;
    data = { ...data, assignments: [] };
  }

  // Sort versions latest-first so project.versions[0] is always the most recent upload
  if (data.versions) {
    data.versions = [...data.versions].sort((a, b) => b.version_number - a.version_number);
  }
  return data;
}

// ─── CLIENT: Create new project ───
export async function createProject({
  title,
  description,
  platform,
  desired_length,
  priority = "medium",
  style_preferences,
  asset_links = [],
  apply_branding = false,
  additional_notes,
  deadline,
  client_id,
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      platform,
      desired_length,
      priority,
      style_preferences,
      asset_links,
      apply_branding,
      additional_notes,
      deadline: deadline || null,
      client_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Fetch all contractor IDs for a project (assignments + legacy fallback) ───
// Always queries fresh from DB — safe to call from any role after RLS policies are set.
export async function fetchAllAssignedContractorIds(projectId) {
  const [assignResult, projectResult] = await Promise.allSettled([
    supabase.from("project_assignments").select("contractor_id").eq("project_id", projectId),
    supabase.from("projects").select("contractor_id").eq("id", projectId).single(),
  ]);

  const ids = new Set();
  if (assignResult.status === "fulfilled" && !assignResult.value.error) {
    (assignResult.value.data || []).forEach((r) => r.contractor_id && ids.add(r.contractor_id));
  }
  if (projectResult.status === "fulfilled" && !projectResult.value.error) {
    const cid = projectResult.value.data?.contractor_id;
    if (cid) ids.add(cid);
  }
  return [...ids];
}

// ─── UPDATE: Project status ───
export async function updateProjectStatus(id, status) {
  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── ADMIN: Assign contractor (legacy single-contractor) ───
export async function assignContractor(projectId, contractorId, adminId) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      contractor_id: contractorId,
      assigned_by: adminId,
      status: "in_progress",
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── ADMIN: Assign contractors with roles (offline/primary/finishing editor) ───
// assignments: { offline_editor?: uuid, primary_editor?: uuid, finishing_editor?: uuid }
// Sets contractor_id to primary_editor (or first provided) for backward compat.
export async function assignContractors(projectId, assignments, adminId) {
  const roles = ["offline_editor", "primary_editor", "finishing_editor"];
  const rows = roles
    .filter((role) => assignments[role])
    .map((role) => ({
      project_id: projectId,
      contractor_id: assignments[role],
      role,
      assigned_by: adminId,
    }));

  if (rows.length === 0) throw new Error("At least one editor role must be assigned.");

  const { error: upsertError } = await supabase
    .from("project_assignments")
    .upsert(rows, { onConflict: "project_id,role" });

  if (upsertError) throw upsertError;

  const primaryId =
    assignments.primary_editor ||
    assignments.offline_editor ||
    assignments.finishing_editor;

  const { data, error } = await supabase
    .from("projects")
    .update({ contractor_id: primaryId, assigned_by: adminId, status: "in_progress" })
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── CONTRACTOR: Update posting details ───
export async function updatePostingDetails(id, { final_video_url, caption, hashtags, posting_notes }) {
  const { data, error } = await supabase
    .from("projects")
    .update({ final_video_url, caption, hashtags, posting_notes })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── CONTRACTOR: Mark ready to post ───
export async function markReadyToPost(id) {
  const { data, error } = await supabase
    .from("projects")
    .update({ status: "ready_to_post" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── ADMIN: Review actions ───
export async function adminApproveProject(id) {
  return updateProjectStatus(id, "completed");
}

export async function adminSendToRevision(id) {
  return updateProjectStatus(id, "revision");
}

// ─── ADMIN: Delete old version files from storage after posting ───
// Keeps the latest version's file; removes all older ones from project-videos bucket.
// DB rows are intentionally kept as audit trail.
export async function cleanupOldVersionFiles(versions) {
  if (!versions || versions.length <= 1) return;

  const oldVersions = versions.slice(1); // versions sorted DESC, index 0 is latest
  const paths = oldVersions
    .map((v) => {
      if (!v.video_url) return null;
      const marker = "/project-videos/";
      const idx = v.video_url.indexOf(marker);
      return idx !== -1 ? v.video_url.slice(idx + marker.length) : null;
    })
    .filter(Boolean);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from("project-videos").remove(paths);
  if (error) console.error("Storage cleanup failed:", error);
}

// ─── ADMIN: Mark as posted ───
export async function markPosted(id, publishedUrl) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      published_url: publishedUrl,
      posted_at: new Date().toISOString(),
      status: "posted",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── CLIENT: Approve project ───
export async function approveProject(id, userId) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      approved_at: new Date().toISOString(),
      approved_by: userId,
      status: "completed",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── COMMENTS ───
export async function fetchComments(projectId, projectVersionId = null) {
  let query = supabase
    .from("project_comments")
    .select(`
      id, content, timecode, project_version_id, created_at,
      author:profiles!author_id(id, name, avatar_url, role)
    `)
    .eq("project_id", projectId);

  query = projectVersionId
    ? query.or(`project_version_id.eq.${projectVersionId},project_version_id.is.null`)
    : query.is("project_version_id", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addComment(
  projectId,
  authorId,
  content,
  timecode = null,
  projectVersionId = null
) {
  const { data, error } = await supabase
    .from("project_comments")
    .insert({
      project_id: projectId,
      author_id: authorId,
      content,
      timecode,
      project_version_id: projectVersionId,
    })
    .select(`
      id, content, timecode, project_version_id, created_at,
      author:profiles!author_id(id, name, avatar_url, role)
    `)
    .single();

  if (error) throw error;
  return data;
}

// ─── VERSION STATUS ───
export async function updateVersionStatus(versionId, status) {
  const { data, error } = await supabase
    .from("project_versions")
    .update({ status })
    .eq("id", versionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── VERSIONS ───
export async function fetchVersions(projectId) {
  const { data, error } = await supabase
    .from("project_versions")
    .select(`
      id, version_number, video_url, notes, status, created_at,
      uploader:profiles!uploaded_by(id, name, avatar_url)
    `)
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createVersion(projectId, { video_url, notes, uploaded_by }) {
  const { data: existing } = await supabase
    .from("project_versions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1;

  const { data, error } = await supabase
    .from("project_versions")
    .insert({
      project_id: projectId,
      version_number: nextVersion,
      video_url,
      notes,
      uploaded_by,
    })
    .select(`
      id, version_number, video_url, notes, status, created_at,
      uploader:profiles!uploaded_by(id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

// ─── ADMIN: Fetch all contractors ───
export async function fetchContractors() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .eq("role", "contractor")
    .order("name");

  if (error) throw error;
  return data;
}

// ─── ADMIN: Fetch admin stats ───
export async function fetchAdminStats() {
  const { data: allProjects, error } = await supabase
    .from("projects")
    .select("status, client_id, contractor_id");

  if (error) throw error;

  const total = allProjects?.length || 0;
  const active = allProjects?.filter(
    (p) => ["submitted", "in_progress", "review", "revision"].includes(p.status)
  ).length || 0;
  const uniqueClients = new Set(allProjects?.map((p) => p.client_id)).size;
  const uniqueContractors = new Set(
    allProjects?.filter((p) => p.contractor_id).map((p) => p.contractor_id)
  ).size;

  return { total, active, uniqueClients, uniqueContractors };
}

// ─── PROFILE: Fetch user profile ─────────────────────────────────────────────
//
// The tricky case: user pays on the landing page (Stripe webhook creates a
// profile row keyed by email with a random UUID), THEN logs in via Google
// (Supabase auth trigger creates ANOTHER profile row keyed by the auth UUID
// with no subscription data).
//
// Resolution order:
//   1. Find profile by auth UUID → if it already has subscription data, done.
//   2. If not, look for a second row with the same email that HAS subscription
//      data (the webhook-created orphan), merge it into the auth row, delete
//      the orphan.
//   3. Fallback: look up by email only (first login, auth trigger hasn't run).

export { fetchUserProfile } from "@/lib/queries/profile";
