import { createBulkNotifications } from '@/lib/queries/notifications'
import { getSupabaseClient, getUser } from "../supabase/client";

// Maps role → preference key for broadcast notifications.
// Contractors have no broadcast preference so they always receive them.
const BROADCAST_PREF_BY_ROLE = {
  client: "broadcastUpdates",
  admin:  "broadcastActivity",
};
const supabase = getSupabaseClient()

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchBroadcasts() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select(
      `
      id, title, message, created_at,
      sent_by,
      recipients:broadcast_recipients(
        id, profile_id, read_at,
        profile:profiles!profile_id(id, name, email, role)
      )
    `
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createBroadcast({ title, message, audience }) {
  const {
    data: { user },
  } = await getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: broadcast, error: broadcastError } = await supabase
    .from('broadcasts')
    .insert({ title, message, sent_by: user.id })
    .select()
    .single()

  if (broadcastError) throw broadcastError

  let profileQuery = supabase.from('profiles').select('id, name, role')
  if (audience !== 'All') {
    const roleMap = {
      Contractors: 'contractor',
      Clients: 'client',
      Management: 'admin',
    }
    profileQuery = profileQuery.eq('role', roleMap[audience] || audience.toLowerCase())
  }

  const { data: profiles, error: profileError } = await profileQuery
  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return broadcast

  const recipientRows = profiles.map(p => ({
    broadcast_id: broadcast.id,
    profile_id: p.id,
  }))

  const { error: recipientError } = await supabase
    .from('broadcast_recipients')
    .insert(recipientRows)

  if (recipientError) throw recipientError

  // Fetch preferences and filter: only send to profiles who have the toggle on.
  const { data: profilesWithPrefs } = await supabase
    .from('profiles')
    .select('id, role, notification_preferences')
    .in('id', profiles.map(p => p.id))

  const filtered = (profilesWithPrefs || profiles).filter((p) => {
    const key = BROADCAST_PREF_BY_ROLE[p.role];
    if (!key) return true;
    const prefs = p.notification_preferences || {};
    return prefs[key] !== false;
  })

  const notifications = filtered.map(p => ({
    user_id: p.id,
    title,
    message,
    type: 'broadcast',
    reference_id: broadcast.id,
  }))

  await createBulkNotifications(notifications)

  return broadcast
}
export async function markBroadcastRead(broadcastId) {
  const {
    data: { user },
  } = await getUser()
  if (!user) return

  const { error } = await supabase
    .from('broadcast_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('broadcast_id', broadcastId)
    .eq('profile_id', user.id)
    .is('read_at', null)

  if (error) throw error
}

export async function deleteBroadcast(broadcastId) {
  const { error } = await supabase.from('broadcasts').delete().eq('id', broadcastId)

  if (error) throw error
}
export async function updateBroadcast(broadcastId, { title, message }) {
  const { data, error } = await supabase
    .from('broadcasts')
    .update({ title, message })
    .eq('id', broadcastId)
    .select()
    .single()

  if (error) throw error
  return data
}
