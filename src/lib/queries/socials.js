import { PLATFORMS } from "@/constants/admin/social";

import { getSupabaseClient, getUser } from "../supabase/client";
const supabase = getSupabaseClient()



export async function fetchSocialPlatforms() {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("social_platforms")
    .select("*")
    .eq("client_id", user.id);

  if (error) throw error;


  return PLATFORMS.map((platform) => {
    const existing = (data || []).find((r) => r.platform === platform);
    return existing || {
      id:        null,
      client_id: user.id,
      platform,
      handle:    null,
      url:       null,
      connected: false,
    };
  });
}

export async function upsertSocialPlatform({ platform, handle, url, connected }) {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("social_platforms")
    .upsert(
      {
        client_id: user.id,
        platform,
        handle:    handle  || null,
        url:       url     || null,
        connected: connected ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id,platform" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAllClientsSocials() {
  const { data, error } = await supabase
    .from("social_platforms")
    .select("*, client:profiles!client_id(id, name, email, avatar_url)")
    .order("client_id");

  if (error) throw error;
  return data || [];
}

export async function disconnectSocialPlatform(platform) {
  const { data: { user } } = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("social_platforms")
    .update({ connected: false, handle: null, url: null, updated_at: new Date().toISOString() })
    .eq("client_id", user.id)
    .eq("platform", platform);

  if (error) throw error;
}
