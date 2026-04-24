import { getSupabaseClient } from "../supabase/client"
const supabase = getSupabaseClient()
export async function createCheckoutSession(plan, profileId, stripeCustomerId) {
  // Try to get the currently logged-in user's email
  let email = null
  let resolvedProfileId = profileId ?? null

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
export async function fetchStripeInvoices(stripeCustomerId) {
  if (!stripeCustomerId) {
    throw new Error('Customer ID not available')
  }

  const response = await fetch(
    `/api/stripe/invoices?customer_id=${encodeURIComponent(stripeCustomerId)}`
  )
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch invoices')
  }
  return response.json()
}
