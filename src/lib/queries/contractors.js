
import { getSupabaseClient } from "../supabase/client"
const supabase = getSupabaseClient()
// ─── Fetch all contractors with assignment history ────────────────────────────
export async function fetchContractors() {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, name, email, avatar_url,
      stripe_connect_id, created_at,
      assigned:projects!contractor_id(id, status, created_at, updated_at)
    `
    )
    .eq('role', 'contractor')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(c => {
    const projects = c.assigned || []
    const active = projects.filter(p =>
      ['submitted', 'in_progress', 'review', 'revision'].includes(p.status)
    ).length
    const completed = projects.filter(p =>
      ['completed', 'ready_to_post', 'posted'].includes(p.status)
    ).length

    const lastProject = [...projects].sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    )[0]

    const lastActivity = lastProject
      ? new Date(lastProject.updated_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Never'

    let status = 'New'
    if (active > 0) status = 'Active'
    else if (completed > 0) status = 'Inactive'

    const completedProjects = projects.filter(p =>
      ['completed', 'ready_to_post', 'posted'].includes(p.status)
    )
    const avgDeliveryDays =
      completedProjects.length > 0
        ? Math.round(
            completedProjects.reduce((sum, p) => {
              const days =
                (new Date(p.updated_at) - new Date(p.created_at)) /
                (1000 * 60 * 60 * 24)
              return sum + Math.max(0, days)
            }, 0) / completedProjects.length
          )
          
        : null
    const avgDeliveryTime = avgDeliveryDays !== null ? `${avgDeliveryDays}d` : null

    return {
      id: c.id,
      name: c.name || 'Unknown',
      email: c.email || '',
      avatar_url: c.avatar_url || null,
      initials: (c.name || '?')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      status,
      activeProjects: active,
      projectsCompleted: completed,
      totalProjects: projects.length,
      lastActivity,
      avgDeliveryTime,
      stripeConnected: !!c.stripe_connect_id,
      memberSince: c.created_at,
    }
  })
}

// ─── Fetch a single contractor with full project history ──────────────────────
export async function fetchContractorById(contractorId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id, name, email, avatar_url, phone,
      stripe_connect_id, created_at,
      projects:projects!contractor_id(
        id, title, status, platform, created_at, updated_at,
        client:profiles!client_id(id, name, email)
      )
    `
    )
    .eq('id', contractorId)
    .single()

  if (error) throw error
  return data
}
