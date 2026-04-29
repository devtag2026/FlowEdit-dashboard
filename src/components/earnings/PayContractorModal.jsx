"use client";
import { useState } from "react";
import { X, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPayment } from "@/lib/queries/earnings";
import { fetchProfile } from "@/lib/queries/profile";
import { notifyPaymentReceived } from "@/lib/queries/notifications";

const CURRENCIES = ["gbp", "usd", "eur"];

const PayContractorModal = ({ contractor, onClose, onSuccess }) => {
  const [form, setForm]     = useState({ amount: "", currency: "gbp", description: "" });
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState(null);

  const handlePay = async () => {
    const amountPence = Math.round(parseFloat(form.amount) * 100);
    if (!form.amount || isNaN(amountPence) || amountPence <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    try {
      setPaying(true);
      setError(null);
      const adminProfile = await fetchProfile();
      await createPayment({
        contractorId: contractor.id,
        adminId:      adminProfile.id,
        amount:       amountPence,
        currency:     form.currency,
        description:  form.description.trim() || null,
      });
      notifyPaymentReceived({
        contractorId: contractor.id,
        amount:       amountPence,
        currency:     form.currency,
      }).catch(console.error);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-accent">Send Payment</h2>
            <p className="text-sm text-accent/60 mt-0.5">To: {contractor.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-accent" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-accent">
              Amount <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="flex-1 h-11 border-accent/20 focus:border-primary focus-visible:ring-0 text-accent"
              />
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-11 px-3 rounded-xl border border-accent/20 text-accent text-sm font-medium bg-white focus:border-primary focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-accent">Description</label>
            <Input
              placeholder="e.g. Video editing — March 2025"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-11 border-accent/20 focus:border-primary focus-visible:ring-0 text-accent"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
        )}

        {form.amount && !isNaN(parseFloat(form.amount)) && (
          <div className="bg-primary/5 rounded-xl px-4 py-3 text-sm">
            <span className="text-accent/60">Sending </span>
            <span className="font-bold text-accent">
              {new Intl.NumberFormat("en-GB", {
                style: "currency", currency: form.currency.toUpperCase(),
              }).format(parseFloat(form.amount) || 0)}
            </span>
            <span className="text-accent/60"> to {contractor.name} via Stripe Connect</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-accent/10">
          <Button variant="ghost" onClick={onClose} disabled={paying} className="text-accent/50 hover:text-accent rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handlePay}
            disabled={paying || !form.amount}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-6 disabled:opacity-50"
          >
            {paying ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
            ) : (
              <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Send Payment</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PayContractorModal;