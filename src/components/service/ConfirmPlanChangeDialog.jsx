"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { previewPlanChange } from "@/lib/queries/billing";

const formatCents = (cents, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
    (cents ?? 0) / 100
  );

const ConfirmPlanChangeDialog = ({
  open,
  onOpenChange,
  mode, // "upgrade" | "downgrade"
  planKey,
  planLabel,
  planPriceLabel,
  currentPlanLabel,
  periodEndLabel,
  submitting,
  error,
  onConfirm,
}) => {
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!open || mode !== "upgrade" || !planKey) return;

    let cancelled = false;
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);

    previewPlanChange(planKey)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) setPreviewError(err.message);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, planKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "upgrade" ? "Upgrade" : "Downgrade"} to {planLabel}
          </DialogTitle>
          <DialogDescription>
            {mode === "upgrade" ? (
              previewLoading ? (
                "Calculating your prorated charge..."
              ) : previewError ? (
                `You'll be charged a prorated amount today, then ${planPriceLabel}/month going forward.`
              ) : (
                <>
                  You'll be charged{" "}
                  <strong>{formatCents(preview?.amount_due, preview?.currency)}</strong> today
                  (prorated) and <strong>{planPriceLabel}/month</strong> thereafter.
                </>
              )
            ) : (
              <>
                You'll keep <strong>{currentPlanLabel}</strong> until{" "}
                <strong>{periodEndLabel}</strong>, then move to <strong>{planLabel}</strong> at{" "}
                <strong>{planPriceLabel}/month</strong>. No charge today.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <DialogClose className="bg-white border border-slate-300 text-accent px-4 py-2 rounded-lg cursor-pointer">
            Cancel
          </DialogClose>
          <Button
            onClick={onConfirm}
            disabled={submitting || (mode === "upgrade" && previewLoading)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm {mode === "upgrade" ? "upgrade" : "downgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmPlanChangeDialog;
