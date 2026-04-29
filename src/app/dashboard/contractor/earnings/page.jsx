"use client";
import Payout from "@/components/earnings/Payout";
import TabNavigation from "@/components/common/TabNavigation";
import WalletSection from "@/components/earnings/WalletSection";
import Loader from "@/components/common/Loader";
import { fetchProfile } from "@/lib/queries/profile";
import { useState, useEffect } from "react";

export default function Earnings() {
  const [activeTab, setActiveTab] = useState("payout");
  const [profile, setProfile]     = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch profile ONCE at page level — no more concurrent getUser() calls
  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((err) => console.error("Failed to load profile:", err))
      .finally(() => setLoadingProfile(false));
  }, []);

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary px-3 md:px-8 py-5 pb-4">
      <TabNavigation
        tabs={[
          { label: "Payouts", value: "payout" },
          { label: "Wallet",  value: "wallet" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Pass profile down — components don't need to call getUser() themselves */}
      {activeTab === "payout" && <Payout  profile={profile} />}
      {activeTab === "wallet" && <WalletSection profile={profile} />}
    </main>
  );
}
