"use client";

import PlanCard from "./PlanCard";
import ConfirmPlanChangeDialog from "./ConfirmPlanChangeDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/common/Button";
import {
  createCheckoutSession,
  changePlan,
  cancelPendingDowngrade,
  createPortalSession,
} from "@/lib/queries/billing";
import { getStripe } from "@/lib/stripe";
import { useState } from "react";

const PLAN_ORDER = { starter: 1, pro: 2, agency: 3 };

const PLANS = [
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

const formatDate = (isoString) => {
  if (!isoString) return "the end of your billing period";
  return new Date(isoString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const PlanCards = ({ profile, onChanged }) => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [dialogPlan, setDialogPlan] = useState(null); // { key, title, price, mode }
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [bannerBusy, setBannerBusy] = useState(false);

  const currentPlanRaw = profile?.subscription_plan ? profile.subscription_plan.toLowerCase() : null;
  const currentPlan = currentPlanRaw !== "launch" ? currentPlanRaw : null;
  const planStatus = profile?.subscription_status || "none";
  const pendingPlan = profile?.pending_plan || null;
  const currentPlanMeta = PLANS.find((p) => p.key === currentPlan);
  const pendingPlanMeta = PLANS.find((p) => p.key === pendingPlan);

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

  const openChangeDialog = (planKey, mode) => {
    const meta = PLANS.find((p) => p.key === planKey);
    setDialogError(null);
    setDialogPlan({ key: planKey, title: meta.title, price: meta.price, mode });
  };

  const handleConfirmChange = async () => {
    if (!dialogPlan) return;
    setSubmitting(true);
    setDialogError(null);
    try {
      const result = await changePlan(dialogPlan.key);
      if (result?.checkoutRequired) {
        setDialogPlan(null);
        await handleSubscribe(dialogPlan.key);
        return;
      }
      setDialogPlan(null);
      onChanged?.();
    } catch (err) {
      setDialogError(err.message || "Failed to change plan");
    } finally {
      setSubmitting(false);
    }
  };

  const goToPortal = async () => {
    setBannerBusy(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      alert(err.message || "Failed to open billing portal");
      setBannerBusy(false);
    }
  };

  const handleKeepCurrentPlan = async () => {
    setBannerBusy(true);
    try {
      await cancelPendingDowngrade();
      onChanged?.();
    } catch (err) {
      alert(err.message || "Failed to cancel pending downgrade");
    } finally {
      setBannerBusy(false);
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

      {pendingPlan && pendingPlanMeta && (
        <Alert className="max-w-5xl mx-auto mb-6">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 w-full">
            <span>
              Your plan changes to <strong>{pendingPlanMeta.title}</strong> on{" "}
              <strong>{formatDate(profile?.current_period_end)}</strong>.
            </span>
            <Button
              onClick={handleKeepCurrentPlan}
              disabled={bannerBusy}
              className="bg-white border border-slate-300 text-accent px-3 py-1.5 rounded-lg text-sm shrink-0 disabled:opacity-60"
            >
              Keep current plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto my-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const isPending = plan.key === pendingPlan;

          let buttonText = null;
          let buttonDisabled = false;
          let onClick = () => handleSubscribe(plan.key);

          if (planStatus === "past_due") {
            buttonText = isCurrent ? "Fix payment method" : null;
            buttonDisabled = !isCurrent || bannerBusy;
            onClick = goToPortal;
          } else if (isCurrent && pendingPlan) {
            buttonText = "Keep this plan";
            onClick = handleKeepCurrentPlan;
            buttonDisabled = bannerBusy;
          } else if (isCurrent) {
            buttonText = "Current Plan";
            buttonDisabled = true;
          } else if (planStatus !== "active") {
            buttonText = "Get Started";
          } else if (isPending) {
            buttonText = "Scheduled";
            buttonDisabled = true;
          } else if (currentPlan) {
            const change = PLAN_ORDER[plan.key] > PLAN_ORDER[currentPlan] ? "upgrade" : "downgrade";
            buttonText = change === "upgrade" ? "Upgrade" : "Downgrade";
            onClick = () => openChangeDialog(plan.key, change);
          }

          return (
            <PlanCard
              key={plan.key}
              plan={{
                ...plan,
                highlighted: isCurrent,
                buttonText,
                buttonDisabled: buttonDisabled || Boolean(loadingPlan),
                onClick,
              }}
            />
          );
        })}
      </div>

      {dialogPlan && (
        <ConfirmPlanChangeDialog
          open={Boolean(dialogPlan)}
          onOpenChange={(next) => !next && setDialogPlan(null)}
          mode={dialogPlan.mode}
          planKey={dialogPlan.key}
          planLabel={dialogPlan.title}
          planPriceLabel={dialogPlan.price.replace(/\s+/g, "")}
          currentPlanLabel={currentPlanMeta?.title}
          periodEndLabel={formatDate(profile?.current_period_end)}
          submitting={submitting}
          error={dialogError}
          onConfirm={handleConfirmChange}
        />
      )}
    </>
  );
};

export default PlanCards;
