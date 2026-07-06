"use client";
import React, { useState, useRef } from "react";
import { X, Loader2, Upload, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getSupabaseClient } from "@/lib/supabase/client";

export default function UploadVersionModal({
  isOpen,
  setIsOpen,
  projectId,
  uploaderId,
  uploaderRole,
  onVersionCreated,
}) {
  // Offline/primary editors upload internal drafts; the finishing editor (and legacy
  // single-contractor projects, where uploaderRole is null) upload the client-visible version.
  const isInternal = !!uploaderRole && uploaderRole !== "finishing_editor";
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || !uploaderId) return;
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      const supabase = getSupabaseClient();
      const ext = file.name.split(".").pop();
      const path = `${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-videos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from("project-videos")
        .getPublicUrl(path);

      const video_url = urlData.publicUrl;

      await createVersion(projectId, {
        video_url,
        notes: notes.trim() || null,
        uploaded_by: uploaderId,
        is_internal: isInternal,
      });

      setUploadProgress(100);
      setFile(null);
      setNotes("");
      fileInputRef.current && (fileInputRef.current.value = "");
      setIsOpen(false);
      onVersionCreated?.();
    } catch (err) {
      console.error("Failed to upload version:", err);
      setError(err.message || "Failed to upload version. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
              {isInternal ? "Upload Internal Version" : "Upload New Version"}
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
            {isInternal
              ? "Internal handoff — not visible to the client"
              : "This version will be visible to the client for review"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-accent mb-1.5 block">
              Video File <span className="text-danger">*</span>
            </label>
            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
                ${file ? "border-primary/50 bg-primary/5" : "border-accent/20 hover:border-primary/40 hover:bg-primary/5"}
                ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileVideo className="w-6 h-6 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-accent truncate max-w-[220px]">{file.name}</p>
                    <p className="text-xs text-accent/50">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-accent/30" />
                  <p className="text-sm text-accent/60">Click to select a video file</p>
                  <p className="text-xs text-accent/40">MP4, MOV, MKV and others supported</p>
                </div>
              )}
            </div>
          </div>

          {isSubmitting && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-accent/60">
                <span>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-accent/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress || 20}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-accent mb-1.5 block">
              Version Notes
            </label>
            <Textarea
              placeholder="What changed in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
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
            disabled={!file || isSubmitting}
            className="w-full bg-primary text-white font-onest font-semibold hover:bg-primary/90 h-11 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading…
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
