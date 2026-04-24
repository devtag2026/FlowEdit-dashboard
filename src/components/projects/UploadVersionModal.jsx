"use client";
import React, { useState } from "react";
import { X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { createVersion } from "@/lib/queries/projects";

export default function UploadVersionModal({
  isOpen,
  setIsOpen,
  projectId,
  uploaderId,
  onVersionCreated,
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!videoUrl.trim() || !uploaderId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createVersion(projectId, {
        video_url: videoUrl.trim(),
        notes: notes.trim() || null,
        uploaded_by: uploaderId,
      });

      setVideoUrl("");
      setNotes("");
      setIsOpen(false);
      onVersionCreated?.();
    } catch (err) {
      console.error("Failed to upload version:", err);
      setError(err.message || "Failed to upload version. Please try again.");
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
              Upload New Version
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
            Paste the video link and add any notes for this version
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-accent mb-1.5 block">
              Video URL <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
              <Input
                placeholder="Paste video link (Google Drive, Frame.io, etc.)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="pl-10 h-12 border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-accent mb-1.5 block">
              Version Notes
            </label>
            <Textarea
              placeholder="What changed in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white border-accent/20 text-accent placeholder:text-accent/40 resize-none min-h-[80px]"
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!videoUrl.trim() || isSubmitting}
            className="w-full bg-primary text-white font-onest font-semibold hover:bg-primary/90 h-11 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Version"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
