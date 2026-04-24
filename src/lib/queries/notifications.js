
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient()

// ─── Fetch all notifications for a user ───
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── Get unread count ───
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

// ─── Mark single notification as read ───
export async function markAsRead(notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Mark all notifications as read ───
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

// ─── Create a notification ───
export async function createNotification({ userId, title, message, type = "project_update", referenceId = null }) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId,
    });

  if (error) throw error;
}

// ─── Create notifications for multiple users ───
export async function createBulkNotifications(notifications) {
  const { error } = await supabase
    .from("notifications")
    .insert(notifications);

  if (error) throw error;
}

// ─── Delete a notification ───
export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

// ─── Fetch all admin user IDs ───
export async function fetchAdminIds() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (error) throw error;
  return data?.map((p) => p.id) || [];
}

// ─── Notify on project events ───
export async function notifyProjectEvent({ event, project, actorName, recipientIds, referenceId }) {
  const messages = {
    project_created: {
      title: "New Project Submitted",
      message: `${actorName} submitted a new project: "${project.title}"`,
      type: "project_update",
    },
    contractor_assigned: {
      title: "Contractor Assigned",
      message: `An editor has been assigned to your project: "${project.title}"`,
      type: "assignment",
    },
    assigned_to_you: {
      title: "New Assignment",
      message: `You've been assigned to: "${project.title}"`,
      type: "assignment",
    },
    submitted_for_review: {
      title: "Ready for Review",
      message: `Your project "${project.title}" is ready for review`,
      type: "project_update",
    },
    revision_requested: {
      title: "Revision Requested",
      message: `${actorName} requested a revision on: "${project.title}"`,
      type: "project_update",
    },
    project_approved: {
      title: "Project Approved",
      message: `"${project.title}" has been approved by the client`,
      type: "project_update",
    },
    marked_ready_to_post: {
      title: "Ready to Post",
      message: `"${project.title}" is ready to be posted`,
      type: "project_update",
    },
    marked_as_posted: {
      title: "Project Posted",
      message: `Your project "${project.title}" has been posted`,
      type: "project_update",
    },
    new_comment: {
      title: "New Comment",
      message: `${actorName} commented on: "${project.title}"`,
      type: "project_update",
    },
  };

  const msg = messages[event];
  if (!msg || !recipientIds?.length) return;

  const notifications = recipientIds.map((userId) => ({
    user_id: userId,
    title: msg.title,
    message: msg.message,
    type: msg.type,
    reference_id: referenceId || project.id,
  }));

  return createBulkNotifications(notifications);
}
