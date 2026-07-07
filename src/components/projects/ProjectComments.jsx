"use client";

import { ChevronDown, Clock, SendHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { notifyProjectEvent } from "@/lib/queries/notifications";
import {
  addComment,
  fetchComments,
  fetchUserProfile,
} from "@/lib/queries/projects";
import { EDITOR_ROLE_LABELS } from "@/lib/utils";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimecode(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const remaining = s % 60;
  return `${m}:${String(remaining).padStart(2, "0")}`;
}

export default function ProjectComments({
  projectId,
  project,
  videoRef,
  projectVersionId = null,
  hasVideo = false,
  isArchived = false,
}) {
  const [comments, setComments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [timecode, setTimecode] = useState(null);
  const [sending, setSending] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [openSort, setOpenSort] = useState(false);

  useEffect(() => {
    async function load() {
      const [commentsData, userProfile] = await Promise.all([
        fetchComments(projectId, projectVersionId),
        fetchUserProfile(),
      ]);
      setComments(commentsData || []);
      setProfile(userProfile);
    }
    load();
  }, [projectId, projectVersionId]);

  useEffect(() => {
    if (!hasVideo || !projectVersionId) setTimecode(null);
  }, [hasVideo, projectVersionId]);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "newest")
      return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === "oldest")
      return new Date(a.created_at) - new Date(b.created_at);
    return 0;
  });

  const options = [
    { key: "newest", label: "Newest first" },
    { key: "oldest", label: "Oldest first" },
  ];

  const handlePinTime = () => {
    if (!hasVideo || !projectVersionId) return;
    const t = videoRef?.current?.getCurrentTime() ?? null;
    if (t !== null) setTimecode(t);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !profile || sending) return;
    setSending(true);
    try {
      const newComment = await addComment(
        projectId,
        profile.id,
        message.trim(),
        timecode,
        projectVersionId,
      );
      setComments((prev) => [newComment, ...prev]);
      setMessage("");
      setTimecode(null);
      if (project) {
        const contractorIds =
          project.assignments?.length > 0
            ? [...new Set(project.assignments.map((a) => a.contractor_id))]
            : project.contractor_id
              ? [project.contractor_id]
              : [];
        const recipientIds = [project.client_id, ...contractorIds].filter(
          (id) => id && id !== profile.id,
        );
        if (recipientIds.length) {
          notifyProjectEvent({
            event: "new_comment",
            project,
            actorName: profile.name,
            recipientIds,
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error("Failed to send comment:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 md:p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="md:text-lg font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>

        <div className="relative text-xs md:text-sm">
          <button
            type="button"
            onClick={() => setOpenSort(!openSort)}
            className="flex items-center gap-1 text-gray-600 hover:text-black"
          >
            Sort by ·{" "}
            <span className="font-semibold">
              {sortBy === "newest" ? "Newest first" : "Oldest first"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {openSort && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg z-50 rounded-lg border border-accent/10">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => {
                    setSortBy(opt.key);
                    setOpenSort(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                >
                  {opt.label}
                  {sortBy === opt.key && (
                    <span className="text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pb-6">
        {isArchived ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
            Comments are locked for previous versions. Switch to the latest version to comment.
          </p>
        ) : (
          <>
            {timecode !== null && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                  @ {formatTimecode(timecode)}
                </span>
                <button
                  type="button"
                  onClick={() => setTimecode(null)}
                  className="text-accent/40 hover:text-accent/80"
                  aria-label="Remove timecode"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="Add a comment..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="text-sm md:text-base pr-20 py-5 border-0 border-b"
                disabled={sending}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {hasVideo && projectVersionId && videoRef && (
                  <button
                    type="button"
                    onClick={handlePinTime}
                    disabled={sending}
                    title="Pin to current video time"
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 text-accent/50 hover:text-primary transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-5 overflow-y-auto pr-2 flex-1">
        {sortedComments.length === 0 ? (
          <p className="text-center text-accent/40 text-sm py-8">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          sortedComments.map((comment) => {
            const isYou = profile && comment.author?.id === profile.id;
            const roleBadge = {
              client:     { label: "Client", className: "bg-blue-100 text-blue-700" },
              contractor: { label: "Editor", className: "bg-purple-100 text-purple-700" },
              admin:      { label: "Admin",  className: "bg-amber-100 text-amber-700" },
            };
            const badge = roleBadge[comment.author?.role];
            const assignmentRole = project?.assignments?.find(
              (a) => a.contractor_id === comment.author?.id
            )?.role;
            const badgeLabel =
              comment.author?.role === "contractor" && assignmentRole
                ? (EDITOR_ROLE_LABELS[assignmentRole] ?? "Editor")
                : badge?.label;

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="md:w-10 md:h-10 shrink-0">
                  {comment.author?.avatar_url ? (
                    <AvatarImage src={comment.author.avatar_url} />
                  ) : (
                    <AvatarFallback className="bg-primary text-white font-bold">
                      {comment.author?.name?.[0] || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-2 mb-1">
                    <span className="font-semibold text-sm md:text-base">
                      {isYou ? "You" : comment.author?.name || "Unknown"}
                    </span>
                    {badge && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badge.className}`}
                      >
                        {badgeLabel}
                      </span>
                    )}
                    <span className="text-xs md:text-sm text-gray-500">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {comment.timecode != null && hasVideo && (
                      <button
                        type="button"
                        onClick={() =>
                          videoRef?.current?.seekTo(comment.timecode)
                        }
                        className="text-[11px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded mr-1 hover:bg-primary/20 transition-colors"
                      >
                        [{formatTimecode(comment.timecode)}]
                      </button>
                    )}
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
