import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json([]);
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    const result = invoices.data.map((inv) => ({
      id:                  inv.id,
      number:              inv.number,
      status:              inv.status,
      created:             inv.created,
      amount_paid:         inv.amount_paid,
      total:               inv.total,
      subscription_plan:   inv.lines?.data?.[0]?.price?.nickname
                           || inv.lines?.data?.[0]?.description
                           || null,
      hosted_invoice_url:  inv.hosted_invoice_url,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    return NextResponse.json(
      { message: err.message || "Error fetching invoices" },
      { status: 500 }
    );
  }
}
