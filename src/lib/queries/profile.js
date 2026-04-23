
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient()
export async function fetchProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url, address, city, notification_preferences, created_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

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
    .select("id, name, email, phone, avatar_url, address, city, notification_preferences, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmail(newEmail) {
  const { error: authError } = await supabase.auth.updateUser({
    email: newEmail,
  });
  if (authError) throw authError;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ email: newEmail })
      .eq("id", user.id);
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

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

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
