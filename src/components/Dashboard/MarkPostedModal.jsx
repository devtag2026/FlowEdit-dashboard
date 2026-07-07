"use client";
import React, { useState } from "react";
import { X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidHttpUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export default function MarkPostedModal({
  isOpen,
  setIsOpen,
  project,
  onMarkPosted,
}) {
  const [publishedUrl, setPublishedUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");

  const handleSubmit = async () => {
    if (!project || !publishedUrl.trim()) return;
    if (!isValidHttpUrl(publishedUrl)) {
      setUrlError("Enter a valid URL starting with https:// or http://");
      return;
    }
    setUrlError("");
    setIsSubmitting(true);
    try {
      await onMarkPosted(project.id, publishedUrl.trim());
      setPublishedUrl("");
    } finally {
      setIsSubmitting(false);
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
              Mark as Posted
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
            Paste the live URL for <span className="font-semibold text-accent">{project?.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
              <Input
                placeholder="https://instagram.com/p/..."
                value={publishedUrl}
                onChange={(e) => {
                  setPublishedUrl(e.target.value);
                  if (urlError) setUrlError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="pl-10 h-12 border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary"
              />
            </div>
            {urlError && (
              <p className="text-xs text-red-500 mt-1.5">{urlError}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!publishedUrl.trim() || isSubmitting}
            className="w-full bg-primary text-white font-onest font-semibold hover:bg-primary/90 h-11 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Mark as Posted"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
