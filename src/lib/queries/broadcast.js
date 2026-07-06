import { createBulkNotifications } from '@/lib/queries/notifications'
import { getSupabaseClient, getUser } from "../supabase/client";

// Maps role → preference key for broadcast notifications.
// Contractors have no broadcast preference so they always receive them.
const BROADCAST_PREF_BY_ROLE = {
  client: "broadcastUpdates",
  admin:  "broadcastActivity",
};
const supabase = getSupabaseClient()


export async function fetchBroadcasts() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select(
      `
      id, title, message, created_at,
      sent_by, status, scheduled_for, audience,
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

async function insertRecipientsAndNotify(broadcastId, title, message, audience) {
  const roleMap = { Contractors: 'contractor', Clients: 'client' }

  let profileQuery = supabase.from('profiles').select('id, name, role')
  if (audience !== 'All') {
    profileQuery = profileQuery.eq('role', roleMap[audience] || audience.toLowerCase())
  }

  const { data: profiles, error: profileError } = await profileQuery
  if (profileError) throw profileError
  if (!profiles || profiles.length === 0) return

  const { error: recipientError } = await supabase
    .from('broadcast_recipients')
    .insert(profiles.map(p => ({ broadcast_id: broadcastId, profile_id: p.id })))
  if (recipientError) throw recipientError

  const { data: profilesWithPrefs } = await supabase
    .from('profiles')
    .select('id, role, notification_preferences')
    .in('id', profiles.map(p => p.id))

  const filtered = (profilesWithPrefs || profiles).filter((p) => {
    const key = BROADCAST_PREF_BY_ROLE[p.role]
    if (!key) return true
    return (p.notification_preferences || {})[key] !== false
  })

  await createBulkNotifications(
    filtered.map(p => ({
      user_id: p.id, title, message,
      type: 'broadcast', reference_id: broadcastId,
    }))
  )
}

export async function createBroadcast({ title, message, audience, scheduledFor }) {
  const { data: { user } } = await getUser()
  if (!user) throw new Error('Not authenticated')

  const isScheduled = !!scheduledFor

  const { data: broadcast, error: broadcastError } = await supabase
    .from('broadcasts')
    .insert({
      title, message, sent_by: user.id,
      audience,
      status:        isScheduled ? 'scheduled' : 'sent',
      scheduled_for: scheduledFor || null,
    })
    .select()
    .single()

  if (broadcastError) throw broadcastError

  if (!isScheduled) {
    await insertRecipientsAndNotify(broadcast.id, title, message, audience)
  }

  return broadcast
}

export async function sendScheduledBroadcast(broadcastId) {
  const { data: broadcast, error } = await supabase
    .from('broadcasts')
    .update({ status: 'sent', scheduled_for: null })
    .eq('id', broadcastId)
    .select()
    .single()
  if (error) throw error

  await insertRecipientsAndNotify(broadcastId, broadcast.title, broadcast.message, broadcast.audience || 'All')
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
