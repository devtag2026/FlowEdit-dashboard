"use client";
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
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function VersionHistory({ versions }) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="bg-tertiary/60 rounded-xl p-5 border border-accent/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <h4 className="text-sm font-bold text-accent uppercase tracking-wide">
        Version History
      </h4>

      <div className="space-y-3">
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-accent/10"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {version.version_number}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-accent">
                  Version {version.version_number}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[version.status] || statusColors.pending}`}>
                  {version.status}
                </span>
                <span className="text-xs text-accent/50">
                  {timeAgo(version.created_at)}
                </span>
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
                className="text-xs text-primary font-semibold hover:underline shrink-0"
              >
                View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
