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

export async function POST(request) {
  try {
    const { plan, profileId, stripeCustomerId } = await request.json();

    if (!plan || !PRICE_MAP[plan]) {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json(
        { message: `Price ID not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_BASE_URL not configured" },
        { status: 500 }
      );
    }

    // If the caller is already logged in, send them back to the dashboard
    // (which polls on session_id) instead of bouncing them to /login, and
    // derive their customer id server-side rather than trusting the body.
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();

    let customerId = stripeCustomerId;
    let successUrl = `${baseUrl}/login?paid=true&plan=${plan}`;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();
      customerId = profile?.stripe_customer_id || customerId;
      successUrl = `${baseUrl}/dashboard/client/service?session_id={CHECKOUT_SESSION_ID}`;
    }

    const sessionArgs = {
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items:           [{ price: priceId, quantity: 1 }],
      metadata:             { plan, ...(profileId && { profileId }) },
      success_url: successUrl,
      cancel_url:  `${baseUrl}/?canceled=true`,
    };

    if (customerId) {
      sessionArgs.customer = customerId;
    }

    const session = await stripe.checkout.sessions.create(sessionArgs);
    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("[Checkout] error:", error);
    return NextResponse.json({ message: error.message || "Unknown error" }, { status: 500 });
  }
}