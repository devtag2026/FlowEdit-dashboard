"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { fetchConnectStatus, startConnectOnboarding } from "@/lib/queries/earnings";
import { useSearchParams } from "next/navigation";

// Accepts profile as prop — no internal fetchProfile() / getUser() call
const WalletSection = ({ profile }) => {
  const [connectStatus, setConnectStatus] = useState(null);
  const [loading, setConnecting]          = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusMsg, setStatusMsg]         = useState(null);
  const searchParams                      = useSearchParams();

  useEffect(() => {
    const connect = searchParams.get("connect");
    if (connect === "success") {
      setStatusMsg({ type: "success", text: "Stripe account connected successfully! Payouts are now enabled." });
    } else if (connect === "refresh") {
      setStatusMsg({ type: "warning", text: "Onboarding incomplete. Please try connecting again." });
    }
  }, [searchParams]);

  // Only fetch connect status — profile already provided via prop
  useEffect(() => {
    if (!profile?.id) return;
    fetchConnectStatus(profile.id)
      .then(setConnectStatus)
      .catch((err) => console.error("Failed to load connect status:", err))
      .finally(() => setLoadingStatus(false));
  }, [profile?.id]);

  const handleConnect = async () => {
    if (!profile) return;
    try {
      setConnecting(true);
      const { url } = await startConnectOnboarding({
        profileId: profile.id,
        email:     profile.email,
      });
      window.location.href = url;
    } catch (err) {
      setStatusMsg({ type: "error", text: err.message || "Failed to start onboarding." });
      setConnecting(false);
    }
  };

  const isConnected = connectStatus?.connected;

  const payoutInfo = [
    { title: "Default Payout Method", value: isConnected ? "Stripe Express" : "—", desc: isConnected ? "Connected via Stripe" : "Not configured" },
    { title: "Payout Schedule",       value: isConnected ? "Manual"     : "—", desc: isConnected ? "Processed by admin"   : "Connect to enable" },
  ];

  if (loadingStatus) {
    return (
      <Card className="bg-tertiary pt-8 md:rounded-3xl">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-tertiary pt-8 md:rounded-3xl">
      <CardContent className="flex flex-col space-y-8">
        <h1 className="text-accent font-semibold md:font-bold text-xl md:text-2xl mb-2">
          Wallet & Payment Details
        </h1>
        <p className="text-slate-700">
          Connect your Stripe account so the admin can send your earnings directly to you.
        </p>

        {statusMsg && (
          <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${
            statusMsg.type === "success" ? "bg-green-50 text-green-700"  :
            statusMsg.type === "warning" ? "bg-amber-50 text-amber-700"  :
                                          "bg-red-50 text-red-600"
          }`}>
            {statusMsg.type === "success"
              ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            }
            {statusMsg.text}
          </div>
        )}

        <div className="flex flex-col space-y-4 md:space-y-3 bg-white rounded-xl p-4 md:p-6">
          <div className="flex md:items-center justify-between flex-col gap-2 md:flex-row">
            <div>
              <h3 className="text-lg md:text-xl text-accent font-bold">
                Stripe Connection Status
              </h3>
              <p className="text-slate-700 text-sm md:text-base">
                {isConnected
                  ? "Your account is connected and payouts are enabled."
                  : "Connect your account to enable payouts."}
              </p>
            </div>
            <span className={`w-fit text-xs py-1 md:text-sm md:py-2 px-4 rounded-full font-bold ${
              isConnected
                ? "bg-green-100 text-green-600"
                : "bg-orange-200 text-orange-500"
            }`}>
              {isConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle className="w-4 h-4" />
              Your Stripe account is set up and ready to receive payments.
            </div>
          ) : (
            <>
              <Button
                onClick={handleConnect}
                disabled={loading}
                className="md:w-fit flex items-center justify-center gap-2 bg-primary px-4 py-3 rounded-full shadow-lg font-bold text-white hover:shadow-xl disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  : <><Link2 className="w-4 h-4" /> Connect Stripe Account</>
                }
              </Button>
              <p className="text-slate-700 text-sm md:text-base">
                You'll be redirected to Stripe Connect to securely complete your payout setup.
              </p>
            </>
          )}
        </div>

        <div>
          <h1 className="text-accent font-bold text-xl md:text-2xl mb-8">
            Payout Information
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {payoutInfo.map((info) => (
              <Card key={info.title} className="bg-white border-0 rounded-3xl">
                <CardContent className="flex flex-col gap-5">
                  <p className="uppercase text-slate-700 text-xs md:text-sm font-bold">
                    {info.title}
                  </p>
                  <h2 className="text-2xl md:text-3xl text-accent font-bold">
                    {info.value}
                  </h2>
                  <p className="text-slate-700">{info.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletSection;
