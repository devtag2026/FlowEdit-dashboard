"use client";
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MoveRight, Check, Upload, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "../Dashboard/StatusBadge";
import ProjectDetails from "./ProjectDetails";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  fetchProjectById,
  approveProject,
  fetchUserProfile,
  updateProjectStatus,
  markReadyToPost,
  updatePostingDetails,
  markPosted,
  updateVersionStatus,
  addComment,
  adminApproveProject,
  adminSendToRevision,
  fetchAllAssignedContractorIds,
  cleanupOldVersionFiles,
} from "@/lib/queries/projects";
import { notifyProjectEvent, fetchAdminIds } from "@/lib/queries/notifications";
import Loader from "@/components/common/Loader";
import ProjectComments from "./ProjectComments";
import ProjectApproveModal from "./ProjectApproveModal";
import VersionHistory from "./VersionHistory";
import UploadVersionModal from "./UploadVersionModal";
import VideoPlayer from "./VideoPlayer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function ProjectSection({ projectId }) {
  const pathname = usePathname();
  const role = pathname.split("/")[2]; // "client" | "admin" | "contractor"

  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Client actions
  const [isRevising, setIsRevising] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  // Contractor actions
  const [submittingForReview, setSubmittingForReview] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [postingDetails, setPostingDetails] = useState({
    caption: "",
    hashtags: "",
    posting_notes: "",
  });
  const [markingReady, setMarkingReady] = useState(false);

  const videoRef = useRef(null);

  // Admin actions
  const [publishedUrl, setPublishedUrl] = useState("");
  const [markingPosted, setMarkingPosted] = useState(false);
  const [adminApproving, setAdminApproving] = useState(false);
  const [isAdminRevisionOpen, setIsAdminRevisionOpen] = useState(false);
  const [adminRevisionReason, setAdminRevisionReason] = useState("");
  const [isAdminRevising, setIsAdminRevising] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [projectData, userProfile] = await Promise.all([
          fetchProjectById(projectId),
          fetchUserProfile(),
        ]);
        setProject(projectData);
        setProfile(userProfile);

        // Pre-fill posting details if they exist
        if (projectData) {
          setPostingDetails({
            caption: projectData.caption || "",
            hashtags: projectData.hashtags || "",
            posting_notes: projectData.posting_notes || "",
          });
          setPublishedUrl(projectData.published_url || "");
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const reloadProject = async () => {
    try {
      const projectData = await fetchProjectById(projectId);
      setProject(projectData);
    } catch (err) {
      console.error("Failed to reload project:", err);
    }
  };

  // Returns all contractor IDs assigned to this project (new roles table + legacy field)
  function getAssignedContractorIds() {
    if (project?.assignments?.length > 0) {
      return [...new Set(project.assignments.map((a) => a.contractor_id))];
    }
    return project?.contractor_id ? [project.contractor_id] : [];
  }

  // ─── Client Actions ───
  const handleApprovalComplete = async () => {
    if (!profile) return;
    try {
      await approveProject(projectId, profile.id);
      const latestVer = project.versions?.length > 0 ? project.versions[0] : null;
      if (latestVer) await updateVersionStatus(latestVer.id, "approved");
      const [contractorIds, adminIds] = await Promise.all([
        fetchAllAssignedContractorIds(projectId),
        fetchAdminIds(),
      ]);
      const recipientIds = [...contractorIds, ...adminIds.filter((id) => id !== profile.id)];
      notifyProjectEvent({ event: "project_approved", project, actorName: profile.name, recipientIds }).catch(console.error);
      await reloadProject();
    } catch (err) {
      console.error("Failed to approve project:", err);
    }
  };

  const handleRevise = async () => {
    if (!revisionReason.trim() || !profile) return;
    setIsRevising(true);
    try {
      await addComment(projectId, profile.id, `Revision requested: ${revisionReason.trim()}`);
      const latestVer = project.versions?.length > 0 ? project.versions[0] : null;
      if (latestVer) await updateVersionStatus(latestVer.id, "rejected");
      await updateProjectStatus(projectId, "revision");
      const recipientIds = getAssignedContractorIds();
      notifyProjectEvent({ event: "revision_requested", project, actorName: profile.name, recipientIds }).catch(console.error);
      setRevisionReason("");
      setIsRevisionOpen(false);
      await reloadProject();
    } catch (err) {
      console.error("Failed to request revision:", err);
    } finally {
      setIsRevising(false);
    }
  };

  // ─── Contractor Actions ───
  const handleSubmitForReview = async () => {
    setSubmittingForReview(true);
    try {
      await updateProjectStatus(projectId, "review");
      // Notify client + all admins (Reviewer in the flow diagram)
      const adminIds = await fetchAdminIds();
      const recipientIds = [
        ...(project.client_id ? [project.client_id] : []),
        ...adminIds.filter((id) => id !== profile?.id),
      ];
      if (recipientIds.length) {
        notifyProjectEvent({ event: "submitted_for_review", project, actorName: profile?.name, recipientIds }).catch(console.error);
      }
      setProject((prev) => ({ ...prev, status: "review" }));
    } catch (err) {
      console.error("Failed to submit for review:", err);
    } finally {
      setSubmittingForReview(false);
    }
  };

  const canMarkReady = postingDetails.caption.trim() && postingDetails.hashtags.trim();

  const handleMarkReady = async () => {
    if (!canMarkReady) return;
    setMarkingReady(true);
    try {
      // Save posting details first, then mark ready
      await updatePostingDetails(projectId, postingDetails);
      const updated = await markReadyToPost(projectId);
      // Notify admins that project is ready to post
      const adminIds = await fetchAdminIds();
      const recipientIds = adminIds.filter((id) => id !== profile?.id);
      if (recipientIds.length) {
        notifyProjectEvent({ event: "marked_ready_to_post", project, actorName: profile?.name, recipientIds }).catch(console.error);
      }
      setProject((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      console.error("Failed to mark ready:", err);
    } finally {
      setMarkingReady(false);
    }
  };

  // ─── Admin Actions ───
  const handleAdminApprove = async () => {
    setAdminApproving(true);
    try {
      await adminApproveProject(projectId);
      const contractorIds = getAssignedContractorIds();
      const recipientIds = [...(project.client_id ? [project.client_id] : []), ...contractorIds];
      notifyProjectEvent({ event: "project_approved", project, actorName: profile?.name, recipientIds }).catch(console.error);
      await reloadProject();
    } catch (err) {
      console.error("Failed to approve project:", err);
    } finally {
      setAdminApproving(false);
    }
  };

  const handleAdminRevise = async () => {
    if (!adminRevisionReason.trim() || !profile) return;
    setIsAdminRevising(true);
    try {
      await addComment(projectId, profile.id, `Admin revision: ${adminRevisionReason.trim()}`);
      const latestVer = project.versions?.length > 0 ? project.versions[0] : null;
      if (latestVer) await updateVersionStatus(latestVer.id, "rejected");
      await adminSendToRevision(projectId);
      const recipientIds = getAssignedContractorIds();
      if (recipientIds.length) {
        notifyProjectEvent({ event: "revision_requested", project, actorName: profile?.name, recipientIds }).catch(console.error);
      }
      setAdminRevisionReason("");
      setIsAdminRevisionOpen(false);
      await reloadProject();
    } catch (err) {
      console.error("Failed to send to revision:", err);
    } finally {
      setIsAdminRevising(false);
    }
  };

  const handleMarkPosted = async () => {
    if (!publishedUrl.trim()) return;
    setMarkingPosted(true);
    try {
      const [updated, contractorIds] = await Promise.all([
        markPosted(projectId, publishedUrl.trim()),
        fetchAllAssignedContractorIds(projectId),
      ]);
      cleanupOldVersionFiles(project.versions).catch(console.error);
      const recipientIds = [...(project.client_id ? [project.client_id] : []), ...contractorIds];
      if (recipientIds.length) {
        notifyProjectEvent({ event: "marked_as_posted", project, actorName: profile?.name, recipientIds }).catch(console.error);
      }
      setProject((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      console.error("Failed to mark as posted:", err);
    } finally {
      setMarkingPosted(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-10 text-center text-accent/60">
        {error || "Project not found"}
      </div>
    );
  }

  const isApproved = project.status === "completed" || !!project.approved_at;
  const isPosted = project.status === "posted";
  const latestVersion = project.versions?.length > 0 ? project.versions[0] : null;

  // Derive this contractor's role on the project from assignments
  const myAssignment = project.assignments?.find((a) => a.contractor_id === profile?.id);
  const myProjectRole = myAssignment?.role ?? null;
  // Only finishing editor submits for review; legacy single-contractor assignments can also submit
  const canSubmitForReview =
    myProjectRole === "finishing_editor" ||
    (!project.assignments?.length && project.contractor_id === profile?.id);

  return (
    <Card className="bg-white rounded-3xl">
      <CardContent className="md:px-10 md:py-8">
        <div className="flex flex-col items-start justify-center gap-5">
          <Link href={`/dashboard/${role}`}>
            <span className="flex items-center text-slate-500 text-sm md:text-lg">
              <ArrowLeft className="w-4 h-4 mt-1 mr-1" /> Back to Dashboard
            </span>
          </Link>

          <h2 className="text-xl md:text-4xl font-semibold my-2">
            {project.title}
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {project.platform && (
              <span className="bg-slate-200 text-xs md:text-sm border rounded-full px-4 py-1 font-bold capitalize">
                {project.platform}
              </span>
            )}
            <StatusBadge status={project.status} />
            <span className="text-xs md:text-sm">
              Updated on {formatDate(project.updated_at)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 h-full">
          <div className="p-3 md:p-6 space-y-4 overflow-hidden">
            {/* Video Player */}
            <VideoPlayer ref={videoRef} src={latestVersion?.video_url ?? null} />

            {/* Version + Actions Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm md:text-lg font-semibold">
                  {latestVersion
                    ? `Version ${latestVersion.version_number}`
                    : "No versions yet"}
                </span>
                {project.versions?.length > 0 && (
                  <button
                    onClick={() => setShowVersions((prev) => !prev)}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    {showVersions ? "Hide History" : `All Versions (${project.versions.length})`}
                  </button>
                )}
              </div>

              {/* ─── Role-based Action Buttons ─── */}
              <TooltipProvider delayDuration={200}>
                <div className="flex gap-2 flex-wrap">

                  {/* CLIENT ACTIONS */}
                  {role === "client" && (
                    <>
                      {isApproved || isPosted ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 text-[#22C55E] font-bold text-sm md:text-xl">
                            <Check className="w-5 h-5" /> Approved
                          </div>
                          {project.asset_links?.[0] && (
                            <a
                              href={project.asset_links[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary font-bold text-xs md:text-sm hover:underline"
                            >
                              Open Cloud Folder →
                            </a>
                          )}
                        </div>
                      ) : project.status === "review" ? (
                        <>
                          <Button
                            variant="ghost"
                            size="lg"
                            className="border border-primary text-primary md:rounded-xl md:px-5 md:py-6 text-xs md:text-base cursor-pointer"
                            onClick={() => setIsRevisionOpen(true)}
                          >
                            Request Revision
                          </Button>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="lg"
                                className="text-white text-xs md:text-base bg-primary md:px-5 md:py-6 md:rounded-xl cursor-pointer"
                                onClick={() => setIsApproveOpen(true)}
                              >
                                Approve
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs">
                              Approve this version as final
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : project.status === "submitted" ? (
                        <span className="text-sm text-accent/50 font-medium">Waiting for assignment...</span>
                      ) : project.status === "in_progress" ? (
                        <span className="text-sm text-accent/50 font-medium">Editor is working on it...</span>
                      ) : project.status === "revision" ? (
                        <span className="text-sm text-accent/50 font-medium">Revision in progress...</span>
                      ) : null}
                    </>
                  )}

                  {/* CONTRACTOR ACTIONS */}
                  {role === "contractor" && (
                    <>
                      {(project.status === "in_progress" || project.status === "review" || project.status === "revision") && (
                        <Button
                          variant="ghost"
                          size="lg"
                          className="border border-primary text-primary hover:bg-primary hover:text-white md:rounded-xl md:px-5 md:py-6 text-xs md:text-base cursor-pointer transition-colors"
                          onClick={() => setIsUploadOpen(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Version
                        </Button>
                      )}

                      {(project.status === "in_progress" || project.status === "revision") && canSubmitForReview && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="lg"
                              className="text-white text-xs md:text-base bg-primary hover:bg-primary/90 md:px-5 md:py-6 md:rounded-xl cursor-pointer transition-colors"
                              onClick={handleSubmitForReview}
                              disabled={submittingForReview}
                            >
                              {submittingForReview ? "Submitting..." : "Submit for Review"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            Submit this version to the client for review
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {project.status === "completed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="lg"
                              className="text-white text-xs md:text-base bg-primary hover:bg-primary/90 md:px-5 md:py-6 md:rounded-xl cursor-pointer transition-colors"
                              onClick={handleMarkReady}
                              disabled={markingReady || !canMarkReady}
                            >
                              {markingReady ? "Saving..." : "Mark Ready to Post"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {canMarkReady
                              ? "Mark this project as ready for the admin to post"
                              : "Fill in caption and hashtags first"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}

                  {/* ADMIN ACTIONS */}
                  {role === "admin" && project.status === "review" && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="border border-primary text-primary md:rounded-xl md:px-5 md:py-6 text-xs md:text-base cursor-pointer"
                      onClick={() => setIsAdminRevisionOpen(true)}
                    >
                      Send to Revision
                    </Button>
                  )}

                  {role === "admin" && project.status === "ready_to_post" && !isPosted && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="text-white text-xs md:text-base bg-primary hover:bg-primary/90 md:px-5 md:py-6 md:rounded-xl cursor-pointer transition-colors"
                      onClick={handleMarkPosted}
                      disabled={markingPosted || !publishedUrl.trim()}
                    >
                      {markingPosted ? "Saving..." : "Mark as Posted"}
                    </Button>
                  )}

                </div>
              </TooltipProvider>
            </div>

            {/* Version History */}
            {showVersions && project.versions?.length > 0 && (
              <VersionHistory versions={project.versions} />
            )}

            {/* Contractor: Posting Details */}
            {role === "contractor" && project.status === "completed" && (
              <div className="bg-tertiary/60 rounded-xl p-5 border border-accent/20 space-y-4">
                <h4 className="text-sm font-bold text-accent uppercase tracking-wide">
                  Posting Details
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-accent/60 mb-1 block">Caption</label>
                    <Textarea
                      placeholder="Write the post caption..."
                      value={postingDetails.caption}
                      onChange={(e) => setPostingDetails((prev) => ({ ...prev, caption: e.target.value }))}
                      className="bg-white border-accent/20 text-accent placeholder:text-accent/40 resize-none min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-accent/60 mb-1 block">Hashtags</label>
                    <Input
                      placeholder="#skincare #tips #beauty"
                      value={postingDetails.hashtags}
                      onChange={(e) => setPostingDetails((prev) => ({ ...prev, hashtags: e.target.value }))}
                      className="bg-white border-accent/20 text-accent placeholder:text-accent/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-accent/60 mb-1 block">Posting Notes</label>
                    <Textarea
                      placeholder="Best time to post, any special instructions..."
                      value={postingDetails.posting_notes}
                      onChange={(e) => setPostingDetails((prev) => ({ ...prev, posting_notes: e.target.value }))}
                      className="bg-white border-accent/20 text-accent placeholder:text-accent/40 resize-none min-h-[60px]"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* Admin: Published URL Input */}
            {role === "admin" && project.status === "ready_to_post" && !isPosted && (
              <div className="bg-tertiary/60 rounded-xl p-5 border border-accent/20 space-y-3">
                <h4 className="text-sm font-bold text-accent uppercase tracking-wide">
                  Published URL
                </h4>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
                  <Input
                    placeholder="Paste the live post URL..."
                    value={publishedUrl}
                    onChange={(e) => setPublishedUrl(e.target.value)}
                    className="pl-10 bg-white border-accent/20 text-accent placeholder:text-accent/40"
                  />
                </div>
              </div>
            )}

            {/* Admin/Client: Show posting details if they exist (read-only) */}
            {(role === "admin" || role === "client") && (project.caption || project.hashtags || project.posting_notes) && (
              <div className="bg-tertiary/60 rounded-xl p-5 border border-accent/20 space-y-3">
                <h4 className="text-sm font-bold text-accent uppercase tracking-wide">
                  Posting Details
                </h4>
                {project.caption && (
                  <div>
                    <p className="text-xs font-semibold text-accent/60">Caption</p>
                    <p className="text-sm text-accent mt-1">{project.caption}</p>
                  </div>
                )}
                {project.hashtags && (
                  <div>
                    <p className="text-xs font-semibold text-accent/60">Hashtags</p>
                    <p className="text-sm text-primary mt-1">{project.hashtags}</p>
                  </div>
                )}
                {project.posting_notes && (
                  <div>
                    <p className="text-xs font-semibold text-accent/60">Posting Notes</p>
                    <p className="text-sm text-accent mt-1">{project.posting_notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Published URL (shown when posted) */}
            {isPosted && project.published_url && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-bold text-sm mb-1">
                  <Check className="w-4 h-4" /> Posted
                </div>
                <a
                  href={project.published_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {project.published_url}
                </a>
                {project.posted_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Posted on {formatDate(project.posted_at)}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="text-sm md:text-base bg-tertiary/60 shadow-lg rounded-xl p-4 border border-accent/20">
              <p className="leading-relaxed">{project.description || "No description provided."}</p>

              <div
                onClick={() => setShowDetails((prev) => !prev)}
                className="flex items-center justify-end gap-2 cursor-pointer text-primary font-semibold text-xs md:text-base mt-1"
              >
                <span>
                  {showDetails ? "Hide Project Details" : "See Project Details"}
                </span>
                <MoveRight className="h-4 w-4" />
              </div>
            </div>

            {showDetails && (
              <div className="mt-6">
                <ProjectDetails project={project} />
              </div>
            )}
          </div>

          <ProjectComments projectId={projectId} project={project} videoRef={videoRef} />
        </div>
      </CardContent>

      {/* Client: Approve Popup */}
      <ProjectApproveModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onApprovalComplete={handleApprovalComplete}
      />

      {/* Contractor: Upload Version Modal */}
      <UploadVersionModal
        isOpen={isUploadOpen}
        setIsOpen={setIsUploadOpen}
        projectId={projectId}
        uploaderId={profile?.id}
        onVersionCreated={reloadProject}
      />

      {/* Admin: Send to Revision Modal */}
      <Dialog open={isAdminRevisionOpen} onOpenChange={(open) => { if (!open && !isAdminRevising) { setIsAdminRevisionOpen(false); setAdminRevisionReason(""); } }}>
        <DialogContent showCloseButton={false} className="w-full max-w-[95vw] sm:max-w-md rounded-2xl bg-tertiary p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="relative">
              <DialogTitle className="text-slate-900 md:text-xl text-left font-bold">
                Send to Revision
              </DialogTitle>
              <DialogClose asChild>
                <button className="absolute right-0 top-0 rounded-md text-accent/60 hover:text-accent transition cursor-pointer" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-gray-500 text-left mt-1">
              Describe what needs to be changed before this project can proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <Textarea
              placeholder="Describe the required changes..."
              value={adminRevisionReason}
              onChange={(e) => setAdminRevisionReason(e.target.value)}
              className="bg-white border-accent/20 text-accent placeholder:text-accent/40 resize-none min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setIsAdminRevisionOpen(false); setAdminRevisionReason(""); }}
                disabled={isAdminRevising}
                className="flex-1 rounded-xl py-5 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminRevise}
                disabled={!adminRevisionReason.trim() || isAdminRevising}
                className="flex-1 rounded-xl py-5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                {isAdminRevising ? "Submitting..." : "Send to Revision"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client: Revision Reason Modal */}
      <Dialog open={isRevisionOpen} onOpenChange={(open) => { if (!open && !isRevising) { setIsRevisionOpen(false); setRevisionReason(""); } }}>
        <DialogContent showCloseButton={false} className="w-full max-w-[95vw] sm:max-w-md rounded-2xl bg-tertiary p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="relative">
              <DialogTitle className="text-slate-900 md:text-xl text-left font-bold">
                Request Revision
              </DialogTitle>
              <DialogClose asChild>
                <button className="absolute right-0 top-0 rounded-md text-accent/60 hover:text-accent transition cursor-pointer" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-gray-500 text-left mt-1">
              Let the editor know what needs to be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <Textarea
              placeholder="Describe what changes you'd like..."
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              className="bg-white border-accent/20 text-accent placeholder:text-accent/40 resize-none min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setIsRevisionOpen(false); setRevisionReason(""); }}
                disabled={isRevising}
                className="flex-1 rounded-xl py-5 text-sm font-semibold border-primary text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevise}
                disabled={!revisionReason.trim() || isRevising}
                className="flex-1 rounded-xl py-5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                {isRevising ? "Submitting..." : "Submit Revision Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ProjectSection;
