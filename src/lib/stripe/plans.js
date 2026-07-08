// Server-side plan/price helpers shared by the checkout, webhook, and
// subscription-management routes so plan classification stays in one place.

export const PRICE_MAP = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export const PLAN_ORDER = { launch: 0, starter: 1, pro: 2, agency: 3 };

// Usage limits advertised on the pricing cards (PlanCards.jsx) — enforced in
// the New Project modal / Request Revision flow and mirrored in the DB
// triggers (supabase/migrations/20260708120000_plan_usage_limits.sql) since
// project/comment writes go through the browser client and are otherwise
// bypassable. Keep both copies in sync when limits change.
export const PLAN_LIMITS = {
  launch: { videosPerPeriod: 0, revisionsPerVideo: 0 },
  starter: { videosPerPeriod: 2, revisionsPerVideo: 1 },
  pro: { videosPerPeriod: 8, revisionsPerVideo: null }, // null = unlimited
  agency: { videosPerPeriod: 20, revisionsPerVideo: null },
};

export function limitsForPlan(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.launch;
}

export function planForPrice(priceId) {
  if (!priceId) return "launch";
  if (priceId === PRICE_MAP.starter) return "starter";
  if (priceId === PRICE_MAP.pro) return "pro";
  if (priceId === PRICE_MAP.agency) return "agency";
  return "launch";
}

export function classifyChange(currentPlan, targetPlan) {
  const current = PLAN_ORDER[currentPlan] ?? 0;
  const target = PLAN_ORDER[targetPlan] ?? 0;
  if (target === current) return "same";
  return target > current ? "upgrade" : "downgrade";
}

// current_period_end moved from the subscription to the subscription item on
// Stripe API versions >= 2025-03-31 (this app pins 2026-03-25.dahlia).
// Tolerate both shapes since webhook payloads can lag the pinned version.
export function periodEndOf(subscription) {
  return subscription?.items?.data?.[0]?.current_period_end ?? subscription?.current_period_end ?? null;
}

export function periodStartOf(subscription) {
  return (
    subscription?.items?.data?.[0]?.current_period_start ?? subscription?.current_period_start ?? null
  );
}
