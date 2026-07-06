
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient()
export async function fetchAllClients() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, name, email, avatar_url, phone,
      subscription_plan, subscription_status,
      created_at,
      projects:projects!client_id(id, status)
    `)
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((client) => {
    const projects  = client.projects || [];
    const active    = projects.filter((p) =>
      ["submitted", "in_progress", "review"].includes(p.status)
    ).length;
    const completed = projects.filter((p) =>
      ["completed", "ready_to_post", "posted"].includes(p.status)
    ).length;

    return {
      id:             client.id,
      name:           client.name || "Unknown",
      email:          client.email,
      avatar_url:     client.avatar_url,
      initials:       (client.name || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2),
      plan:           client.subscription_plan  || "None",
      status:         client.subscription_status || "none",
      activeProjects: active,
      totalProjects:  projects.length,
      completed,
      memberSince:    client.created_at,
    };
  });
}

export async function fetchClientById(clientId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id, name, email, avatar_url, phone,
      subscription_plan, subscription_status, created_at,
      projects:projects!client_id(
        id, title, status, platform, created_at, updated_at
      )
    `)
    .eq("id", clientId)
    .single();

  if (error) throw error;
  return data;
}
