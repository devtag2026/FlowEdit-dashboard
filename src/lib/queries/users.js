
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient()

// ─── Fetch all users (clients + contractors only, admins excluded) ────────────
export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, name, email, avatar_url, role,
      subscription_plan, subscription_status,
      stripe_connect_id, created_at, social_access,
      client_projects:projects!client_id(id, status),
      contractor_projects:projects!contractor_id(id, status),
      assignment_entries:project_assignments!contractor_id(project_id, project:projects!project_id(id, status))
    `
    )
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((user) => {
    const clientProjects     = user.client_projects || [];
    const contractorProjects = user.contractor_projects || [];
    const legacyIds          = new Set(contractorProjects.map((p) => p.id));

    // Projects from project_assignments not already counted via legacy contractor_id
    const assignmentProjects = (user.assignment_entries || [])
      .map((a) => a.project)
      .filter((p) => p && !legacyIds.has(p.id));

    const allProjects = [...clientProjects, ...contractorProjects, ...assignmentProjects];

    const activeProjects = allProjects.filter((p) =>
      ["submitted", "in_progress", "review", "revision"].includes(p.status)
    ).length;

    const totalProjects = allProjects.length;

    return {
      id: user.id,
      name: user.name || "Unknown",
      email: user.email || "",
      avatar_url: user.avatar_url || null,
      initials: (user.name || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      role: user.role || "client",
      plan: user.subscription_plan || null,
      subscriptionStatus: user.subscription_status || null,
      stripeConnected: !!user.stripe_connect_id,
      socialAccess: user.social_access || {},
      activeProjects,
      totalProjects,
      memberSince: user.created_at,
      canChangeRole: activeProjects === 0 && totalProjects === 0,
    };
  });
}

// ─── Check if a user has any data associations that would block role change ───
export async function checkUserAssociations(userId) {
  const errors = [];

  // Check projects as client
  const { data: clientProjects, error: cpErr } = await supabase
    .from("projects")
    .select("id, status")
    .eq("client_id", userId);

  if (cpErr) throw cpErr;
  if (clientProjects && clientProjects.length > 0) {
    errors.push(
      `User has ${clientProjects.length} project${clientProjects.length > 1 ? "s" : ""} as a client`
    );
  }

  // Check projects as contractor
  const { data: contractorProjects, error: coErr } = await supabase
    .from("projects")
    .select("id, status")
    .eq("contractor_id", userId);

  if (coErr) throw coErr;
  if (contractorProjects && contractorProjects.length > 0) {
    errors.push(
      `User has ${contractorProjects.length} project${contractorProjects.length > 1 ? "s" : ""} as a contractor`
    );
  }

  // Check contractor_documents (contracts, policies)
  try {
    const { data: docs, error: docErr } = await supabase
      .from("contractor_documents")
      .select("id")
      .eq("contractor_id", userId);

    if (!docErr && docs && docs.length > 0) {
      errors.push(`User has ${docs.length} contractor document${docs.length > 1 ? "s" : ""}`);
    }
  } catch {
    // Table may not exist yet — skip
  }

  // Check contractor_payments
  try {
    const { data: payments, error: payErr } = await supabase
      .from("contractor_payments")
      .select("id")
      .eq("contractor_id", userId);

    if (!payErr && payments && payments.length > 0) {
      errors.push(`User has ${payments.length} payment record${payments.length > 1 ? "s" : ""}`);
    }
  } catch {
    // Table may not exist yet — skip
  }

  return {
    canChange: errors.length === 0,
    reasons: errors,
  };
}

// ─── Update user role ────────────────────────────────────────────────────────
export async function updateUserRole(userId, newRole) {
  // Double-check associations before updating
  const { canChange, reasons } = await checkUserAssociations(userId);
  if (!canChange) {
    throw new Error(`Cannot change role: ${reasons.join(". ")}.`);
  }

  // Use server API route — direct client-side update is blocked by RLS
  const res = await fetch("/api/admin/update-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, newRole }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to update role.");
  return result.user;
}
