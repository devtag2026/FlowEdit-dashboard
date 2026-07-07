import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { planForPrice, periodEndOf } from "@/lib/stripe/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2026-03-25.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

async function syncSubscription({
  customerId,
  status,
  plan,
  email,
  subscriptionId,
  currentPeriodEnd,
  clearPending,
  clearSubscription,
}) {
  if (!customerId && !email) return;

  const profilePayload = {
    subscription_status: status,
    ...(plan             && { subscription_plan:    plan }),
    ...(customerId       && { stripe_customer_id:   customerId }),
    ...(subscriptionId   && { stripe_subscription_id: subscriptionId }),
    ...(currentPeriodEnd && {
      current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
    }),
    ...(clearPending     && { pending_plan: null, stripe_schedule_id: null }),
    ...(clearSubscription && { stripe_subscription_id: null, current_period_end: null }),
  };

  let updated = false;

  if (customerId) {
    const { data } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("stripe_customer_id", customerId)
      .select("id");
    if (data?.length > 0) updated = true;
  }

  if (!updated && email) {
    const { data } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("email", email)
      .select("id");
    if (data?.length > 0) updated = true;
  }

  if (!updated && email) {
    await supabase
      .from("pending_subscriptions")
      .upsert(
        {
          email,
          stripe_customer_id:     customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
          subscription_status:    status,
          subscription_plan:      plan ?? "launch",
          updated_at:             new Date().toISOString(),
        },
        { onConflict: "email" }
      );
  }
}

async function clearScheduleByScheduleId(scheduleId) {
  if (!scheduleId) return;
  await supabase
    .from("profiles")
    .update({ pending_plan: null, stripe_schedule_id: null })
    .eq("stripe_schedule_id", scheduleId);
}

export async function POST(req) {
  const payload = await req.text();
  const header  = req.headers.get("stripe-signature");

  if (!header) {
    return NextResponse.json({ message: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, header, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const { type, data: { object: obj } } = event;

  try {
    switch (type) {
      case "checkout.session.completed": {
        const customerId = obj.customer;
        const email      = obj.customer_details?.email ?? obj.metadata?.email ?? null;
        const plan       = obj.metadata?.plan ?? "launch";

        let resolvedPlan = plan;
        let subscriptionId = null;
        let currentPeriodEnd = null;
        if (obj.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(obj.subscription);
            const priceId = sub?.items?.data?.[0]?.price?.id;
            if (priceId) resolvedPlan = planForPrice(priceId);
            subscriptionId = sub.id;
            currentPeriodEnd = periodEndOf(sub);
          } catch {}
        }

        await syncSubscription({
          customerId,
          status: "active",
          plan: resolvedPlan,
          email,
          subscriptionId,
          currentPeriodEnd,
        });
        break;
      }
      case "customer.subscription.updated": {
        const plan = planForPrice(obj.items?.data?.[0]?.price?.id);
        // obj.schedule is null once a subscription schedule finishes/releases,
        // which is how we know a pending downgrade has taken effect.
        await syncSubscription({
          customerId: obj.customer,
          status: obj.status,
          plan,
          subscriptionId: obj.id,
          currentPeriodEnd: periodEndOf(obj),
          clearPending: !obj.schedule,
        });
        break;
      }
      case "customer.subscription.deleted": {
        await syncSubscription({
          customerId: obj.customer,
          status: "canceled",
          plan: "launch",
          clearPending: true,
          clearSubscription: true,
        });
        break;
      }
      case "invoice.payment_failed": {
        await syncSubscription({ customerId: obj.customer, status: "past_due" });
        break;
      }
      case "subscription_schedule.released":
      case "subscription_schedule.canceled": {
        await clearScheduleByScheduleId(obj.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json({ message: "Processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
