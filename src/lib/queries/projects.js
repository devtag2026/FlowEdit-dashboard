
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
export async function fetchContractorProjects(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:profiles!client_id(id, name, email, avatar_url)
    `)
    .eq("contractor_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:profiles!client_id(id, name, email, avatar_url),
      contractor:profiles!contractor_id(id, name, email, avatar_url),
      comments:project_comments(
        id, content, created_at,
        author:profiles!author_id(id, name, avatar_url)
      ),
      versions:project_versions(
        id, version_number, video_url, notes, status, created_at,
        uploader:profiles!uploaded_by(id, name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
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

// ─── ADMIN: Assign contractor ───
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
  return updateProjectStatus(id, "in_progress");
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
export async function fetchComments(projectId) {
  const { data, error } = await supabase
    .from("project_comments")
    .select(`
      id, content, created_at,
      author:profiles!author_id(id, name, avatar_url, role)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addComment(projectId, authorId, content) {
  const { data, error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, author_id: authorId, content })
    .select(`
      id, content, created_at,
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
    (p) => p.status === "submitted" || p.status === "in_progress" || p.status === "review"
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

// Drop-in replacement for the fetchUserProfile function in src/lib/queries/projects.js
//
// Resolution order:
//   1. Find profile by auth UUID → if it already has subscription data, done.
//   2. If not, check pending_subscriptions (webhook wrote here before user logged in)
//      → merge into the auth row, delete the pending row.
//   3. Fallback: look up profile by email only (edge case: auth trigger slow).

// Replace the fetchUserProfile function in src/lib/queries/projects.js

export async function fetchUserProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  // ── 1. Normal lookup by auth UUID ─────────────────────────────────────────
  const { data: profileById } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileById) {
    const hasSubscription =
      profileById.subscription_status &&
      profileById.subscription_status !== "none" &&
      profileById.subscription_plan   &&
      profileById.subscription_plan   !== "launch";

    if (!hasSubscription && user.email) {
      // ── 2. Call server-side merge route (needs service_role to read pending_subscriptions)
      try {
        const res = await fetch("/api/auth/merge-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });
        const result = await res.json();

        if (result.merged && result.data) {
         
          return { ...profileById, ...result.data, auth_id: user.id };
        }
      } catch (err) {
        console.error("[fetchUserProfile] merge-subscription call failed:", err);
      }
    }

    return { ...profileById, auth_id: user.id };
  }


if (user.email) {
  const { data: profileByEmail } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (profileByEmail) {
    return { ...profileByEmail, auth_id: user.id };
  }
}

  return null;
}
