
import { getSupabaseClient } from "../supabase/client";
const supabase = getSupabaseClient();

// Maps each project event to the preference key that must be true per recipient role.
// Roles not listed for an event are always notified (no opt-out exists for them).
const EVENT_PREF_MAP = {
  project_created:      { admin: "newProjectSubmitted" },
  contractor_assigned:  { client: "projectUpdates", admin: "contractorActivity" },
  assigned_to_you:      { contractor: "projectAssigned" },
  submitted_for_review: { client: "projectUpdates", admin: "contractorActivity" },
  revision_requested:   { contractor: "revisionRequests", admin: "clientActivity", client: "projectUpdates" },
  project_approved:     { admin: "clientActivity", contractor: "projectAssigned" },
  marked_ready_to_post: { admin: "clientActivity", client: "projectUpdates" },
  marked_as_posted:     { client: "projectUpdates", contractor: "projectAssigned", admin: "clientActivity" },
  new_comment:          { client: "projectUpdates", contractor: "revisionRequests", admin: "clientActivity" },
};

// Fetches role + preferences for a list of user IDs.
async function fetchRecipientProfiles(userIds) {
  if (!userIds?.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, notification_preferences")
    .in("id", userIds);
  if (error) throw error;
  return data || [];
}

// Filters a list of profiles to those who have the preference enabled.
// prefKeyByRole: { role: preferenceKey } — if a role has no key, always include them.
// Defaults to true when the preference key is absent (new users get everything).
function filterByPref(profiles, prefKeyByRole) {
  return profiles
    .filter((p) => {
      const key = prefKeyByRole[p.role];
      if (!key) return true;
      const prefs = p.notification_preferences || {};
      return prefs[key] !== false;
    })
    .map((p) => p.id);
}

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

  // Filter recipients by their notification preferences for this event.
  const prefKeyByRole = EVENT_PREF_MAP[event] || {};
  let filteredIds = recipientIds;
  if (Object.keys(prefKeyByRole).length > 0) {
    const profiles = await fetchRecipientProfiles(recipientIds);
    filteredIds = filterByPref(profiles, prefKeyByRole);
  }
  if (!filteredIds.length) return;

  const notifications = filteredIds.map((userId) => ({
    user_id: userId,
    title: msg.title,
    message: msg.message,
    type: msg.type,
    reference_id: referenceId || project.id,
  }));

  return createBulkNotifications(notifications);
}

// ─── Notify a contractor when a payment is sent ───
export async function notifyPaymentReceived({ contractorId, amount, currency }) {
  const profiles = await fetchRecipientProfiles([contractorId]);
  const prefs = profiles[0]?.notification_preferences || {};
  if (prefs.paymentReceived === false) return;

  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  return createNotification({
    userId: contractorId,
    title: "Payment Received",
    message: `${formatted} has been sent to your Stripe account.`,
    type: "project_update",
  });
}
