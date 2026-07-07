import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export async function GET() {
  try {
    const authClient = await createAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ connected: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_connect_id) {
      return NextResponse.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);

    const connected =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    return NextResponse.json({
      connected,
      details_submitted:  account.details_submitted,
      charges_enabled:    account.charges_enabled,
      payouts_enabled:    account.payouts_enabled,
      stripe_connect_id:  profile.stripe_connect_id,
    });
  } catch (err) {
    console.error("[Connect] status error:", err);
    return NextResponse.json({ connected: false, error: err.message });
  }
}
