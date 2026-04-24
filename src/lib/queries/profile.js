
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient();

// ── fetchProfile ──────────────────────────────────────────────────────────────
// Returns the authenticated user's profile enriched with OAuth fallbacks:
//  - avatar_url  → falls back to Google OAuth picture when column is null
//  - created_at  → falls back to auth.users created_at when column is null
//  - notification_preferences → returns null if column doesn't exist yet
//    (UI shows an error; fix: ALTER TABLE profiles ADD COLUMN
//     notification_preferences JSONB DEFAULT '{}'::jsonb;)
export async function fetchProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Try the full column list
  let { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url, address, city, created_at, notification_preferences")
    .eq("id", user.id)
    .single();

  // If notification_preferences column doesn't exist yet, fall back to safe columns
  if (error) {
    const { data: safe, error: safeErr } = await supabase
      .from("profiles")
      .select("id, name, email, phone, avatar_url, address, city, created_at")
      .eq("id", user.id)
      .single();
    if (safeErr) throw safeErr;
    data = { ...safe, notification_preferences: null };
  }

  // Google OAuth stores the profile picture in user_metadata – use as fallback.
  // Also check user.identities for providers that put it there instead.
  const oauthAvatar =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture ||
    null;

  return {
    ...data,
    avatar_url: data.avatar_url || oauthAvatar,
    // Supabase auth.users always has created_at – use as fallback
    created_at: data.created_at || user.created_at || null,
  };
}

// ── updateProfile ─────────────────────────────────────────────────────────────
// Saves profile fields to DB. If notification_preferences column doesn't
// exist, throws a descriptive error so the UI can surface it clearly.
// Fix: ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;
export async function updateProfile({ name, phone, address, city, notification_preferences }) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const payload = {};
  if (name !== undefined) payload.name = name;
  if (phone !== undefined) payload.phone = phone;
  if (address !== undefined) payload.address = address;
  if (city !== undefined) payload.city = city;
  if (notification_preferences !== undefined) payload.notification_preferences = notification_preferences;

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id, name, email, phone, avatar_url, address, city, created_at, notification_preferences")
    .single();

  if (error) {
    if (notification_preferences !== undefined) {
      throw new Error(
        "Could not save notification preferences. " +
        "Run this SQL in Supabase: ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT \'{}\'::jsonb;"
      );
    }
    throw error;
  }
  return data;
}

export async function updateEmail(newEmail) {
  const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
  if (authError) throw authError;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ email: newEmail }).eq("id", user.id);
  }
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function uploadAvatar(file) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop();
  const filePath = `avatars/${user.id}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)
    .select("avatar_url")
    .single();
  if (error) throw error;
  return data.avatar_url;
}

export async function removeAvatar() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) throw error;
}
