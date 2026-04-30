"use client";
import React from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

const ProjectSuccessModal = ({ isOpen, onClose, onDone }) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

        <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm rounded-2xl bg-white p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
              <Check className="w-6 h-6 font-semibold" />
            </div>
          </div>

          <h2 className="text-lg text-slate-900 font-bold mb-2">Success!</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your project has been approved. The final video will be delivered to you shortly.
          </p>

          <Button
            onClick={onDone}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded py-3 cursor-pointer"
          >
            Done
          </Button>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ProjectSuccessModal;
