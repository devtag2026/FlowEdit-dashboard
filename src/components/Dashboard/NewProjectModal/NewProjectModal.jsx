"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose } from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormSection, FormField } from "./FormSection";
import { createProject, fetchUserProfile } from "@/lib/queries/projects";
import { hasBranding } from "@/lib/queries/branding";
import { notifyProjectEvent, fetchAdminIds } from "@/lib/queries/notifications";
import Link from "next/link";

export default function NewProjectRequestModal({ isOpen, setIsOpen, clientId, onProjectCreated }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      projectTitle: "",
      projectDescription: "",
      platform: "",
      desiredLength: "",
      priority: "medium",
      cloudFolderLink: "",
      editingNotes: "",
      additionalNotes: "",
      deadline: "",
    },
  });

  const [applyBranding, setApplyBranding] = useState(false);
  const [brandingExists, setBrandingExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (clientId) {
      hasBranding(clientId).then(setBrandingExists).catch(() => setBrandingExists(false));
    }
  }, [clientId]);

  const onSubmit = async (data) => {
    if (!clientId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const rawLink = data.cloudFolderLink.trim();
      const assetLinks = rawLink
        ? [rawLink.match(/^https?:\/\//) ? rawLink : `https://${rawLink}`]
        : [];

      const newProject = await createProject({
        title: data.projectTitle,
        description: data.projectDescription || null,
        platform: data.platform || null,
        desired_length: data.desiredLength || null,
        priority: data.priority || "medium",
        style_preferences: data.editingNotes || null,
        apply_branding: applyBranding,
        additional_notes: data.additionalNotes || null,
        asset_links: assetLinks,
        deadline: data.deadline || null,
        client_id: clientId,
      });

      // Notify admins about new project
      const [userProfile, adminIds] = await Promise.all([fetchUserProfile(), fetchAdminIds()]);
      if (adminIds.length && newProject) {
        notifyProjectEvent({
          event: "project_created",
          project: { id: newProject.id, title: data.projectTitle },
          actorName: userProfile?.name || "A client",
          recipientIds: adminIds,
        }).catch(console.error);
      }

      reset();
      setApplyBranding(false);
      setIsOpen(false);
      onProjectCreated?.();
    } catch (err) {
      console.error("Failed to create project:", err);
      setSubmitError(err.message || "Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setApplyBranding(false);
    setSubmitError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        showCloseButton={false}
        className="
          w-full max-w-[95vw] sm:max-w-7xl
          max-h-[90vh]
          rounded-4xl
          bg-tertiary
          p-0
          overflow-y-auto
          overscroll-contain
          scroll-smooth
          no-scrollbar
        "
      >
        {/* ─── Header ─── */}
        <DialogHeader className="px-10 pt-10 pb-6">
          <div className="relative">
            <DialogTitle className="text-2xl font-bold font-onest text-accent">
              New Project Request
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
            Each request creates one completed video. For multiple outputs, submit separate requests
          </DialogDescription>
        </DialogHeader>

        {/* ─── Form Body ─── */}
        <div className="px-10 pb-10 space-y-10">

          {/* ─── Project Details ─── */}
          <FormSection title="Project Details">
            <FormField label="Project Title" required error={errors.projectTitle}>
              <Input
                placeholder="Enter project title"
                {...register("projectTitle", {
                  required: "Project title is required",
                })}
                className="h-12 border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary"
              />
            </FormField>

            <FormField label="Project Description" error={errors.projectDescription}>
              <Textarea
                placeholder="Describe your video"
                rows={5}
                {...register("projectDescription")}
                className="bg-white! border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary resize-none min-h-[140px] w-full"
              />
              <p className="text-xs text-accent/50 mt-1.5">
                Describe purpose, tone and goals
              </p>
            </FormField>

            <FormField label="Platform" required error={errors.platform}>
              <Select value={watch("platform")} onValueChange={(value) => setValue("platform", value)}>
                <SelectTrigger className="h-12 bg-white! border-accent/20 text-accent focus:border-primary focus:ring-primary w-full">
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Desired Length" required error={errors.desiredLength}>
              <Select value={watch("desiredLength")} onValueChange={(value) => setValue("desiredLength", value)}>
                <SelectTrigger className="h-12 bg-white! border-accent/20 text-accent focus:border-primary focus:ring-primary w-full">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15-30 seconds">15-30 seconds</SelectItem>
                  <SelectItem value="30-60 seconds">30-60 seconds</SelectItem>
                  <SelectItem value="1-3 minutes">1-3 minutes</SelectItem>
                  <SelectItem value="3-5 minutes">3-5 minutes</SelectItem>
                  <SelectItem value="5-10 minutes">5-10 minutes</SelectItem>
                  <SelectItem value="10+ minutes">10+ minutes</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Priority">
              <Select value={watch("priority")} onValueChange={(value) => setValue("priority", value)}>
                <SelectTrigger className="h-12 bg-white! border-accent/20 text-accent focus:border-primary focus:ring-primary w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Deadline">
              <Input
                type="date"
                {...register("deadline")}
                className="h-12 border-accent/20 text-accent focus:border-primary focus:ring-primary"
              />
            </FormField>
          </FormSection>

          {/* ─── Footage & Assets ─── */}
          <FormSection title="Footage & Assets">
            <FormField label="Cloud Folder Link (Required)" required error={errors.cloudFolderLink}>
              <Input
                placeholder="Paste Google Drive, Dropbox, or OneDrive link"
                {...register("cloudFolderLink", {
                  required: "Cloud folder link is required",
                })}
                className="h-12 border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary"
              />
            </FormField>

            <div
              className={`flex items-start gap-3 bg-accent/5 rounded-xl p-5 ${brandingExists ? "cursor-pointer" : "opacity-60"}`}
              onClick={() => brandingExists && setApplyBranding(!applyBranding)}
            >
              <Checkbox
                checked={applyBranding}
                onCheckedChange={(checked) => brandingExists && setApplyBranding(checked)}
                disabled={!brandingExists}
                className="mt-0.5 border-accent/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div>
                <p className="text-sm font-semibold text-accent">
                  Apply my branding template to this project
                </p>
                {brandingExists ? (
                  <p className="text-xs text-accent/50 mt-0.5">
                    Use saved colors, fonts, logos, and editing style
                  </p>
                ) : (
                  <p className="text-xs text-accent/50 mt-0.5">
                    No branding saved yet.{" "}
                    <Link href="/dashboard/client/branding" className="text-primary font-semibold hover:underline">
                      Set up branding →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* ─── Editing Instructions ─── */}
          <FormSection title="Editing Instructions">
            <FormField label="Editing Notes" required error={errors.editingNotes}>
              <Textarea
                placeholder="Style direction, pacing, mood, music preferences..."
                rows={5}
                {...register("editingNotes", {
                  required: "Editing notes are required",
                })}
                className="bg-white! border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary resize-none min-h-[140px] w-full"
              />
              <p className="text-xs text-accent/50 mt-1.5">
                Style direction, pacing, mood, music preferences...
              </p>
            </FormField>
          </FormSection>

          {/* ─── Additional Notes ─── */}
          <FormSection title="Additional notes">
            <FormField label="Notes For Editor (Optional)">
              <Textarea
                placeholder="Any additional clarifications..."
                rows={4}
                {...register("additionalNotes")}
                className="bg-white! border-accent/20 text-accent placeholder:text-accent/40 focus:border-primary focus:ring-primary resize-none min-h-[120px] w-full"
              />
            </FormField>
          </FormSection>

          {submitError && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
              <p className="text-sm text-danger">{submitError}</p>
            </div>
          )}

          {/* ─── Footer ─── */}
          <div className="flex flex-col gap-4 pt-6 border-t border-accent/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-accent/60 font-onest">
              You will receive a confirmation once your project is added to your dashboard
            </p>

            <div className="flex items-center gap-4 shrink-0">
              <Button
                type="button"
                onClick={handleReset}
                variant="ghost"
                className="text-primary font-semibold font-onest hover:bg-primary/5"
              >
                Reset to Defaults
              </Button>

              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-primary text-white font-onest font-semibold hover:bg-primary/90 px-8 h-11 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
