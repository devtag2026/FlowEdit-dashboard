import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PRICE_MAP } from "@/lib/stripe/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2026-03-25.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function POST(req) {
  const authClient = await createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({}));
  if (!plan || !PRICE_MAP[plan]) {
    return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id || !profile.stripe_subscription_id) {
    return NextResponse.json({ message: "No active subscription" }, { status: 400 });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items?.data?.[0];

    const preview = await stripe.invoices.createPreview({
      customer: profile.stripe_customer_id,
      subscription: profile.stripe_subscription_id,
      subscription_details: {
        items: [{ id: item.id, price: PRICE_MAP[plan] }],
        proration_behavior: "always_invoice",
      },
    });

    return NextResponse.json({
      amount_due: preview.amount_due,
      currency: preview.currency,
    });
  } catch (err) {
    console.error("[Subscription preview] error:", err);
    return NextResponse.json({ message: err.message || "Failed to preview plan change" }, { status: 500 });
  }
}
