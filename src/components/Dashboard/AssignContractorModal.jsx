"use client";
import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export default function AssignContractorModal({
  isOpen,
  setIsOpen,
  project,
  contractors,
  onAssign,
}) {
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedContractor || !project) return;
    setIsAssigning(true);
    try {
      await onAssign(project.id, selectedContractor);
    } finally {
      setIsAssigning(false);
      setSelectedContractor(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[95vw] sm:max-w-md rounded-2xl bg-tertiary p-0"
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="relative">
            <DialogTitle className="text-xl font-bold font-onest text-accent">
              Assign Editor
            </DialogTitle>
            <DialogClose asChild>
              <button
                className="absolute right-0 top-0 rounded-md p-2 text-accent/60 hover:text-accent hover:bg-accent/10 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
          <DialogDescription className="text-sm font-onest text-accent/60 mt-1">
            Choose an editor for <span className="font-semibold text-accent">{project?.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {contractors.map((contractor) => (
              <div
                key={contractor.id}
                onClick={() => setSelectedContractor(contractor.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedContractor === contractor.id
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-white border-2 border-transparent hover:bg-accent/5"
                }`}
              >
                <Avatar className="w-9 h-9">
                  {contractor.avatar_url ? (
                    <AvatarImage src={contractor.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                      {contractor.name?.[0] || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-accent">{contractor.name}</p>
                  <p className="text-xs text-accent/50">{contractor.email}</p>
                </div>
                {selectedContractor === contractor.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
            {contractors.length === 0 && (
              <p className="text-sm text-accent/50 text-center py-4">
                No contractors available
              </p>
            )}
          </div>

          <Button
            onClick={handleAssign}
            disabled={!selectedContractor || isAssigning}
            className="w-full bg-primary text-white font-onest font-semibold hover:bg-primary/90 h-11 disabled:opacity-50"
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Editor"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
