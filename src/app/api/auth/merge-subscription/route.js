import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Service-role client for privileged write operations only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function POST(req) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ merged: false, error: "Missing userId or email" }, { status: 400 });
    }

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
    const { data: pending, error: pendingError } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (pendingError) {
      console.error("[merge-subscription] select error:", pendingError.message);
      return NextResponse.json({ merged: false, error: pendingError.message }, { status: 500 });
    }

    if (!pending) {
      return NextResponse.json({ merged: false, reason: "no_pending_row" });
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
      .eq("email", email);

    console.log("[merge-subscription] merged for", email, "→", mergePayload);
    return NextResponse.json({ merged: true, data: mergePayload });

  } catch (err) {
    console.error("[merge-subscription] unexpected error:", err);
    return NextResponse.json({ merged: false, error: err.message }, { status: 500 });
  }
}