
"use client";

import Invoice from "@/components/service/Invoice";
import PaymentDetail from "@/components/service/PaymentDetail";
import PlanCards from "@/components/service/PlanCards";
import TabNavigation from "@/components/common/TabNavigation";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchUserProfile } from "@/lib/queries/projects";

export default function ServicePageClient() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const userProfile = await fetchUserProfile();
      console.log("RAW PROFILE:", userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("canceled");

    const clearQuery = () => {
      const params = new URLSearchParams(window.location.search);
      params.delete("session_id");
      params.delete("canceled");
      const cleaned = params.toString();
      router.replace(`${window.location.pathname}${cleaned ? `?${cleaned}` : ""}`);
    };

    if (sessionId || canceled) {
      loadProfile();

      if (sessionId) {
        let attempts = 0;
        const intervalId = setInterval(async () => {
          attempts += 1;
          const updated = await fetchUserProfile();
          if (updated) {
            setProfile(updated);
          }

          const plan = updated?.subscription_plan?.toLowerCase();
          if (plan && plan !== "starter") {
            clearInterval(intervalId);
            clearQuery();
            return;
          }

          if (attempts >= 6) {
            clearInterval(intervalId);
            clearQuery();
          }
        }, 3000);

        return () => clearInterval(intervalId);
      }

      clearQuery();
    }
  }, [searchParams, loadProfile, router]);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-secondary px-3 md:px-8 py-5 pb-4">
        <header className="mb-10">
          <h1 className="text-accent font-semibold text-2xl md:text-3xl mb-2">
            Services & Billing
          </h1>
          <p className="text-accent text-sm md:text-base">
            Manage your subscription, view invoices, and update payment details.
          </p>
          {profile?.subscription_plan && (
            <div>
              {profile.subscription_status !== "active" && (
                <span className="ml-2 text-primary/80">
                  (Upgrade to continue submitting projects)
                </span>
              )}
            </div>
          )}
        </header>

        <TabNavigation
          tabs={[
            { label: "Overview", value: "overview" },
            { label: "Invoices", value: "invoices" },
            { label: "Payment", value: "payment" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          containerClassName="border border-tertiary md:bg-tertiary w-5xl"
          buttonClassName="text-accent text-lg font-semibold md:px-6"
        />

        {activeTab === "overview" && <PlanCards profile={profile} />}
        {activeTab === "invoices" && (
          <Invoice customerId={profile?.stripe_customer_id} />
        )}
        {activeTab === "payment" && <PaymentDetail profile={profile} />}


      </main>
    </>
  );
}
