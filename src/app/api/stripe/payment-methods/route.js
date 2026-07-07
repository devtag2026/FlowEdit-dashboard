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
    // Fetch payment methods attached to this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Get the default payment method from the customer object
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPmId =
      customer.invoice_settings?.default_payment_method ||
      customer.default_source;

    const result = paymentMethods.data.map((pm) => ({
      id:        pm.id,
      brand:     pm.card?.brand     || "card",
      last4:     pm.card?.last4     || "****",
      exp_month: pm.card?.exp_month || "--",
      exp_year:  pm.card?.exp_year  || "--",
      isDefault: pm.id === defaultPmId,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error fetching payment methods:", err);
    return NextResponse.json(
      { message: err.message || "Error fetching payment methods" },
      { status: 500 }
    );
  }
}
