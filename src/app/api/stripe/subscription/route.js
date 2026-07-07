import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { periodEndOf } from "@/lib/stripe/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2026-03-25.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function GET() {
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, pending_plan, current_period_end")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id || profile.subscription_status === "none") {
    return NextResponse.json({
      plan: profile?.subscription_plan || "launch",
      status: profile?.subscription_status || "none",
      subscription: null,
    });
  }

  try {
    let subscriptionId = profile.stripe_subscription_id;
    let currentPeriodEnd = profile.current_period_end;

    // Lazy backfill for subscribers that predate stripe_subscription_id being stored
    if (!subscriptionId) {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "all",
        limit: 1,
      });
      const sub = subs.data?.[0];
      if (sub) {
        subscriptionId = sub.id;
        const periodEnd = periodEndOf(sub);
        currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
        await supabase
          .from("profiles")
          .update({ stripe_subscription_id: subscriptionId, current_period_end: currentPeriodEnd })
          .eq("id", user.id);
      }
    }

    if (!subscriptionId) {
      return NextResponse.json({
        plan: profile.subscription_plan,
        status: profile.subscription_status,
        subscription: null,
      });
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const price = sub.items?.data?.[0]?.price;

    return NextResponse.json({
      plan: profile.subscription_plan,
      status: profile.subscription_status,
      current_period_end: profile.current_period_end,
      pending_plan: profile.pending_plan,
      price_id: price?.id || null,
      amount: price?.unit_amount ?? null,
    });
  } catch (err) {
    console.error("[Subscription] error:", err);
    return NextResponse.json({ message: err.message || "Error fetching subscription" }, { status: 500 });
  }
}
