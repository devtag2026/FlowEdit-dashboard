import { X, Clock, UserCheck, Megaphone } from "lucide-react";
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

const typeMeta = {
  project_update: { label: "Project Update", bg: "bg-primary/10",  text: "text-primary",   Icon: Clock },
  assignment:     { label: "Assignment",      bg: "bg-blue-50",     text: "text-blue-600",  Icon: UserCheck },
  broadcast:      { label: "Broadcast",       bg: "bg-amber-50",    text: "text-amber-600", Icon: Megaphone },
};

const NotificationDetail = ({
  notification,
  setSelectedNotification,
  isMobile,
  setMobileDetailOpen,
}) => {
  const meta       = typeMeta[notification.type] || typeMeta.project_update;
  const isBroadcast = notification.type === "broadcast";

  const handleClose = () =>
    isMobile ? setMobileDetailOpen(false) : setSelectedNotification(null);

  return (
    <div className="flex flex-col h-full p-6">

      {/* Top bar */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${meta.bg}`}>
            <meta.Icon size={18} className={meta.text} />
          </div>
          <div>
            <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Clock size={11} />
              {formatTime(notification.created_at)}
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-accent/5 hover:bg-accent/10 transition-colors shrink-0"
        >
          <X size={15} className="text-accent/60" />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold text-accent mb-4 leading-snug">
        {notification.title}
      </h2>

      <div className="w-full h-px bg-accent/8 mb-4" />

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isBroadcast ? (
          <div
            className="prose prose-sm max-w-none text-slate-600 leading-relaxed
              [&_ul]:list-disc [&_ul]:pl-5
              [&_ol]:list-decimal [&_ol]:pl-5
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-accent [&_h2]:mt-3 [&_h2]:mb-1
              [&_strong]:font-semibold
              [&_em]:italic
              [&_u]:underline
              [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: notification.message }}
          />
        ) : (
          <p className="text-slate-600 whitespace-pre-line leading-relaxed text-sm">
            {notification.message}
          </p>
        )}
      </div>

      {/* Footer link */}
      {notification.reference_id && !isBroadcast && (
        <div className="mt-6 pt-4 border-t border-accent/8">
          <a
            href={`${window.location.pathname.replace("/notification", "")}/projects/${notification.reference_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View Project →
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationDetail;
