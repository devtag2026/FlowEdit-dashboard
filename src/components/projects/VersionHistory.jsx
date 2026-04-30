"use client";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const statusColors = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function VersionHistory({ versions, selectedVersionId, onSelectVersion }) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="bg-tertiary/60 rounded-xl p-5 border border-accent/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <h4 className="text-sm font-bold text-accent uppercase tracking-wide">
        Version History
      </h4>

      <div className="space-y-3">
        {versions.map((version, idx) => {
          const isSelected = version.id === selectedVersionId;
          const isLatest   = idx === 0;

          return (
            <button
              key={version.id}
              type="button"
              onClick={() => onSelectVersion?.(version)}
              className={`w-full text-left flex items-start gap-3 rounded-lg p-3 border transition-all ${
                isSelected
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                  : "bg-white border-accent/10 hover:border-accent/25 hover:bg-accent/3"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"
              }`}>
                {version.version_number}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-accent">
                    Version {version.version_number}
                  </span>
                  {isLatest && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Latest
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[version.status] || statusColors.pending}`}>
                    {version.status}
                  </span>
                  <span className="text-xs text-accent/50">
                    {timeAgo(version.created_at)}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-primary">
                      ← Viewing
                    </span>
                  )}
                </div>

                {version.notes && (
                  <p className="text-xs text-accent/70 mt-1">{version.notes}</p>
                )}

                {version.uploader && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Avatar className="w-5 h-5">
                      {version.uploader.avatar_url ? (
                        <AvatarImage src={version.uploader.avatar_url} />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-primary text-[8px] font-bold">
                          {version.uploader.name?.[0] || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-[11px] text-accent/50">
                      {version.uploader.name}
                    </span>
                  </div>
                )}
              </div>

              {version.video_url && (
                <a
                  href={version.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-accent/30 hover:text-primary shrink-0 mt-0.5 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
