import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { planForPrice, periodEndOf, PLAN_ORDER } from "@/lib/stripe/plans";

// Service-role client for privileged write operations only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2026-03-25.dahlia",
});

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

// Last-resort linkage: the checkout is created by the separate landing app, so
// there may be no pending row and no metadata to lean on. Ask Stripe directly
// whether this email owns a live subscription and adopt the highest-tier one.
// Requires the dashboard's Stripe key to be in the same mode as the payment.
async function reconcileFromStripe(email) {
  const { data: customers } = await stripe.customers.list({ email, limit: 10 });
  if (!customers?.length) return null;

  let best = null; // { plan, order, sub, customerId }
  for (const customer of customers) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });
    for (const sub of subs.data) {
      if (!ACTIVE_STATUSES.has(sub.status)) continue;
      const plan = planForPrice(sub.items?.data?.[0]?.price?.id);
      const order = PLAN_ORDER[plan] ?? 0;
      if (order === 0) continue; // price maps to launch — nothing to adopt
      if (!best || order > best.order) {
        best = { plan, order, sub, customerId: customer.id };
      }
    }
  }

  if (!best) return null;

  const periodEnd = periodEndOf(best.sub);
  return {
    subscription_status:    best.sub.status,
    subscription_plan:      best.plan,
    stripe_customer_id:     best.customerId,
    stripe_subscription_id: best.sub.id,
    current_period_end:     periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };
}

export async function POST(req) {
  try {
    const { userId, email: rawEmail } = await req.json();

    if (!userId || !rawEmail) {
      return NextResponse.json({ merged: false, error: "Missing userId or email" }, { status: 400 });
    }

    // Match the normalization the webhook applies when it stages pending rows,
    // otherwise a case/whitespace difference means we never find the payment.
    const email = rawEmail.trim().toLowerCase();

    // Verify the caller is the same user as userId — prevents IDOR attacks
    const authClient = await createAuthClient();
    const { data: { user: caller } } = await authClient.auth.getUser();
    if (!caller || caller.id !== userId) {
      return NextResponse.json({ merged: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile already has subscription data
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_plan, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const hasSubscription =
      profile?.subscription_status &&
      profile.subscription_status !== "none" &&
      profile?.subscription_plan &&
      profile.subscription_plan !== "launch";

    if (hasSubscription) {
      // Already up to date — nothing to do
      return NextResponse.json({ merged: false, reason: "already_has_subscription" });
    }

    // Look for a pending row
    // ilike (case-insensitive) so we also recover rows staged before emails
    // were normalized on write — otherwise a stuck payment stays stuck.
    const { data: pending, error: pendingError } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (pendingError) {
      console.error("[merge-subscription] select error:", pendingError.message);
      return NextResponse.json({ merged: false, error: pendingError.message }, { status: 500 });
    }

    if (!pending) {
      // No staged row (e.g. paid on the landing app, or webhook raced the
      // redirect). Fall back to asking Stripe directly by email.
      const reconciled = await reconcileFromStripe(email);
      if (!reconciled) {
        return NextResponse.json({ merged: false, reason: "no_pending_row" });
      }

      const { error: reconcileError } = await supabase
        .from("profiles")
        .update(reconciled)
        .eq("id", userId);

      if (reconcileError) {
        console.error("[merge-subscription] reconcile update error:", reconcileError.message);
        return NextResponse.json({ merged: false, error: reconcileError.message }, { status: 500 });
      }

      console.log("[merge-subscription] reconciled from Stripe for", email, "→", reconciled);
      return NextResponse.json({ merged: true, data: reconciled, source: "stripe" });
    }

    // Merge into the real profile row
    const mergePayload = {
      subscription_status: pending.subscription_status,
      subscription_plan:   pending.subscription_plan,
      stripe_customer_id:  pending.stripe_customer_id,
      ...(pending.stripe_subscription_id && { stripe_subscription_id: pending.stripe_subscription_id }),
      ...(pending.name    && { name:    pending.name }),
      ...(pending.address && { address: pending.address }),
      ...(pending.city    && { city:    pending.city }),
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(mergePayload)
      .eq("id", userId);

    if (updateError) {
      console.error("[merge-subscription] update error:", updateError.message);
      return NextResponse.json({ merged: false, error: updateError.message }, { status: 500 });
    }

    // Clean up staging row
    await supabase
      .from("pending_subscriptions")
      .delete()
      .ilike("email", email);

    console.log("[merge-subscription] merged for", email, "→", mergePayload);
    return NextResponse.json({ merged: true, data: mergePayload });

  } catch (err) {
    console.error("[merge-subscription] unexpected error:", err);
    return NextResponse.json({ merged: false, error: err.message }, { status: 500 });
  }
}