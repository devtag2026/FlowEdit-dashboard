import { X, Clock } from "lucide-react";
import React from "react";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const typeLabels = {
  project_update: "Project Update",
  assignment:     "Assignment",
  broadcast:      "Broadcast",
};

const typeBadgeColors = {
  project_update: "bg-primary text-white",
  assignment:     "bg-blue-500 text-white",
  broadcast:      "bg-amber-500 text-white",
};

const NotificationDetail = ({
  notification,
  setSelectedNotification,
  isMobile,
  setMobileDetailOpen,
}) => {
  const typeLabel = typeLabels[notification.type] || notification.type;
  const badgeColor = typeBadgeColors[notification.type] || "bg-primary text-white";

  // Broadcast messages are stored as rich HTML — render them properly
  // All other notification messages are plain text
  const isBroadcast = notification.type === "broadcast";

  const content = (
    <div className="space-y-6 p-3 relative">
      <div className={`absolute ${isMobile ? "top-4 right-3" : "top-0 right-0"}`}>
        <X
          className="w-4 h-4 text-gray-700 cursor-pointer"
          onClick={() =>
            isMobile ? setMobileDetailOpen(false) : setSelectedNotification(null)
          }
        />
      </div>

      <div className="mt-4 flex flex-col items-start justify-between space-y-6">
        <h2 className="text-2xl font-semibold text-accent mb-2 pr-6">
          {notification.title}
        </h2>

        <div className="flex items-center gap-3 mt-4">
          <span className={`px-4 py-1 rounded text-sm font-semibold capitalize ${badgeColor}`}>
            {typeLabel}
          </span>
          <span className="flex items-center gap-1 font-semibold text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {formatTime(notification.created_at)}
          </span>
        </div>

        {/* ── Message ── */}
        {isBroadcast ? (
          // Rich HTML from Tiptap — render with full prose styles
          <div
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-5
              [&_ol]:list-decimal [&_ol]:pl-5
              [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-accent [&_h2]:mt-3 [&_h2]:mb-1
              [&_strong]:font-bold
              [&_em]:italic
              [&_u]:underline
              [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: notification.message }}
          />
        ) : (
          // Plain text for project updates, assignments etc.
          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
            {notification.message}
          </p>
        )}

        {notification.reference_id && (
          <a
            href={`${window.location.pathname.replace("/notification", "")}/projects/${notification.reference_id}`}
            className="text-primary font-semibold text-sm hover:underline"
          >
            View Project →
          </a>
        )}
      </div>
    </div>
  );

  return content;
};

export default NotificationDetail;