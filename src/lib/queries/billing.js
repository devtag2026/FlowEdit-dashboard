import { getSupabaseClient, getUser } from "../supabase/client"
const supabase = getSupabaseClient()
export async function createCheckoutSession(plan, profileId, stripeCustomerId) {
  // Try to get the currently logged-in user's email
  let email = null
  let resolvedProfileId = profileId ?? null

  try {
    const {
      data: { user },
    } = await getUser()
    if (user) {
      email = user.email ?? null

      // Also try to get the profile id if not supplied
      if (!resolvedProfileId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, stripe_customer_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          resolvedProfileId = profile.id
          stripeCustomerId ??= profile.stripe_customer_id
        }
      }
    }
  } catch {
    // Not logged in — fine, continue without email pre-fill
  }

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan,
      profileId: resolvedProfileId,
      stripeCustomerId: stripeCustomerId ?? null,
      email, // ← new: passed to checkout and into Stripe metadata
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create checkout session')
  }

  return res.json()
}
export async function fetchStripeInvoices() {
  const response = await fetch('/api/stripe/invoices')
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch invoices')
  }
  return response.json()
}

export async function fetchPaymentMethods() {
  const response = await fetch('/api/stripe/payment-methods')
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch payment methods')
  }
  return response.json()
}

export async function fetchSubscription() {
  const response = await fetch('/api/stripe/subscription')
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to fetch subscription')
  }
  return response.json()
}

export async function changePlan(plan) {
  const response = await fetch('/api/stripe/subscription/change-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to change plan')
  }
  return data
}

export async function cancelPendingDowngrade() {
  const response = await fetch('/api/stripe/subscription/change-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel_pending' }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to cancel pending downgrade')
  }
  return data
}

export async function previewPlanChange(plan) {
  const response = await fetch('/api/stripe/subscription/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to preview plan change')
  }
  return data
}

export async function createPortalSession() {
  const response = await fetch('/api/stripe/portal', { method: 'POST' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Failed to open billing portal')
  }
  return data
}
