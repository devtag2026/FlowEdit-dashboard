"use client";
import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogPortal } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import ProjectSuccessModal from "./ProjectSuccessModal";

const ProjectApproveModal = ({ isOpen, onClose, onApprovalComplete }) => {
  const [isApproving, setIsApproving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      if (onApprovalComplete) await onApprovalComplete();
      setShowSuccess(true);
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleFinalDone = () => {
    setShowSuccess(false);
    handleClose();
  };

  const handleJustCloseSuccess = () => {
    setShowSuccess(false);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isApproving) handleClose();
      }}
    >
      <DialogPortal>
        <DialogContent
          className="
            w-full max-w-[95vw] sm:max-w-md
            rounded-2xl bg-tertiary p-0
          "
        >
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="relative">
              <DialogTitle className="text-slate-900 md:text-xl text-left font-bold">
                Approve Project
              </DialogTitle>

              <DialogClose asChild>
                <button
                  className="absolute right-0 top-0 rounded-md text-accent/60 hover:text-accent transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-gray-500 text-left mt-1">
              Are you sure you want to approve this project? This will mark it as approved and notify your editor team.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isApproving}
              className="flex-1 rounded-xl py-5 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="flex-1 rounded-xl py-5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </div>

          <ProjectSuccessModal
            isOpen={showSuccess}
            onClose={handleJustCloseSuccess}
            onDone={handleFinalDone}
          />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ProjectApproveModal;
