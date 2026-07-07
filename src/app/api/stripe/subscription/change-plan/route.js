import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PRICE_MAP, classifyChange, periodEndOf } from "@/lib/stripe/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2026-03-25.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

function toIso(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function POST(req) {
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { plan, action } = body;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, stripe_schedule_id, pending_plan"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  if (action === "cancel_pending") {
    if (!profile.stripe_schedule_id) {
      return NextResponse.json({ message: "No pending downgrade to cancel" }, { status: 400 });
    }
    try {
      await stripe.subscriptionSchedules.release(profile.stripe_schedule_id);
    } catch (err) {
      console.error("[change-plan] release error:", err);
      return NextResponse.json({ message: err.message || "Failed to cancel pending downgrade" }, { status: 500 });
    }
    await supabase
      .from("profiles")
      .update({ pending_plan: null, stripe_schedule_id: null })
      .eq("id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (!plan || !PRICE_MAP[plan]) {
    return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
  }

  // Choosing the current plan while a downgrade is pending cancels that downgrade.
  if (plan === profile.subscription_plan && profile.pending_plan) {
    try {
      await stripe.subscriptionSchedules.release(profile.stripe_schedule_id);
    } catch (err) {
      console.error("[change-plan] release error:", err);
      return NextResponse.json({ message: err.message || "Failed to cancel pending downgrade" }, { status: 500 });
    }
    await supabase
      .from("profiles")
      .update({ pending_plan: null, stripe_schedule_id: null })
      .eq("id", user.id);
    return NextResponse.json({ ok: true });
  }

  if (plan === profile.subscription_plan) {
    return NextResponse.json({ message: "Already on this plan" }, { status: 400 });
  }

  // No active subscription to modify — caller should fall back to Checkout.
  if (profile.subscription_status === "none" || profile.subscription_status === "canceled" || !profile.stripe_subscription_id) {
    return NextResponse.json({ checkoutRequired: true });
  }

  if (profile.subscription_status === "past_due") {
    return NextResponse.json(
      { message: "Update your payment method before changing plans", portalRequired: true },
      { status: 409 }
    );
  }

  const change = classifyChange(profile.subscription_plan, plan);
  const targetPrice = PRICE_MAP[plan];

  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items?.data?.[0];

    if (change === "upgrade") {
      // Release any pending downgrade first — Stripe rejects item updates on
      // subscriptions that are actively managed by a schedule.
      if (profile.stripe_schedule_id) {
        await stripe.subscriptionSchedules.release(profile.stripe_schedule_id);
      }

      const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: item.id, price: targetPrice }],
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
      });

      await supabase
        .from("profiles")
        .update({
          subscription_plan: plan,
          pending_plan: null,
          stripe_schedule_id: null,
          current_period_end: toIso(periodEndOf(updated)),
        })
        .eq("id", user.id);

      return NextResponse.json({ ok: true, plan });
    }

    // Downgrade: schedule the price change to take effect at period end.
    let schedule;
    if (profile.stripe_schedule_id) {
      schedule = await stripe.subscriptionSchedules.retrieve(profile.stripe_schedule_id);
    } else {
      schedule = await stripe.subscriptionSchedules.create({ from_subscription: profile.stripe_subscription_id });
    }

    const periodEnd = periodEndOf(sub);
    const currentPrice = item.price.id;

    schedule = await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: currentPrice, quantity: 1 }],
          start_date: schedule.phases[0].start_date,
          end_date: periodEnd,
        },
        {
          items: [{ price: targetPrice, quantity: 1 }],
          proration_behavior: "none",
        },
      ],
    });

    await supabase
      .from("profiles")
      .update({ pending_plan: plan, stripe_schedule_id: schedule.id })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, pending_plan: plan, effective_at: toIso(periodEnd) });
  } catch (err) {
    console.error("[change-plan] error:", err);
    return NextResponse.json({ message: err.message || "Failed to change plan" }, { status: 500 });
  }
}
