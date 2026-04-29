"use client";

import PlanCard from "./PlanCard";
import { createCheckoutSession } from "@/lib/queries/billing";
import { getStripe } from "@/lib/stripe";
import { useState } from "react";

const PlanCards = ({ profile }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const planOrder = { starter: 1, pro: 2, agency: 3 };
  const currentPlanRaw = profile?.subscription_plan ? profile.subscription_plan.toLowerCase() : null;
  const currentPlan = currentPlanRaw !== "launch" ? currentPlanRaw : null;
  const currentOrder = currentPlan ? planOrder[currentPlan] || null : null;

  const plans = [
    {
      key: "starter",
      title: "Starter",
      price: "$ 499",
      description: "Perfect for individuals.",
      features: ["2 videos per month", "48h Turnaround", "Stock Footage included", "1 Revision round"],
    },
    {
      key: "pro",
      title: "Pro",
      price: "$ 999",
      description: "Great for growing brands.",
      features: ["8 videos per month", "24h Turnaround", "Premium Stock Assets", "Unlimited Revisions", "Dedicated Editor"],
    },
    {
      key: "agency",
      title: "Agency",
      price: "$ 2499",
      description: "For high-volume teams.",
      features: ["20 videos per month", "Priority Support", "Custom Motion Graphics", "Stack Integration", "White-labeling"],
    },
  ];

  const handleSubscribe = async (plan) => {
    if (!profile?.id) {
      alert("Please sign in before upgrading your plan.");
      return;
    }

    try {
      setLoadingPlan(plan);
      const payload = await createCheckoutSession(plan, profile.id, profile.stripe_customer_id);
      const url = payload?.url;
      const sessionId = payload?.id;

      if (url) {
        window.location.href = url;
        return;
      }

      if (!sessionId) {
        throw new Error("Checkout session did not return a URL or session ID.");
      }

      const stripe = await getStripe();
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result?.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error("Failed to start checkout", err);
      alert(`Checkout initialization failed: ${err?.message ?? err}`);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <section className="text-center my-10">
        <h2 className="text-accent text-xl font-bold md:text-2xl md:font-semibold mb-2">
          Simple, transparent pricing
        </h2>
        <p className="text-accent text-sm md:text-base md:text-slate-600">
          Choose the plan that best fits your content needs. All plans include
          professional editing and fast delivery.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto my-6">
        {plans.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const planStatus = profile?.subscription_status || "none";

          let buttonText = null;
          let buttonDisabled = false;

          if (isCurrent) {
            buttonText = "Current Plan";
            buttonDisabled = true;
          } else if (planStatus !== "active") {
            buttonText = "Get Started";
          }

          return (
            <PlanCard
              key={plan.key}
              plan={{
                ...plan,
                highlighted: isCurrent,
                buttonText,
                buttonDisabled: buttonDisabled || loadingPlan,
                onClick: () => handleSubscribe(plan.key),
              }}
            />
          );
        })}
      </div>
    </>
  );
};

export default PlanCards;
