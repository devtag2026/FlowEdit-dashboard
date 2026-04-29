import { Clock, Bell, UserCheck, MessageCircle, Megaphone } from "lucide-react";
import React from "react";

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

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const typeToIcon = {
  project_update: Clock,
  assignment:     UserCheck,
  broadcast:      Megaphone,
};

const typeIconBg = {
  project_update: "bg-primary/10",
  assignment:     "bg-blue-50",
  broadcast:      "bg-amber-50",
};

const typeIconColor = {
  project_update: "text-primary",
  assignment:     "text-blue-500",
  broadcast:      "text-amber-500",
};

const NotificationBar = ({
  notifications,
  setSelectedNotification,
  setMobileDetailOpen,
  selectedId,
}) => {
  return (
    <div className="mt-4 overflow-y-auto max-h-[calc(100vh-280px)] space-y-2 pr-1 nice-scrollbar">
      {notifications.map((notification) => {
        const Icon     = typeToIcon[notification.type] || MessageCircle;
        const isSelected = selectedId === notification.id;
        const isUnread = !notification.is_read;
        const preview  = stripHtml(notification.message);
        const iconBg   = typeIconBg[notification.type]    || "bg-primary/10";
        const iconClr  = typeIconColor[notification.type] || "text-primary";

        return (
          <div key={notification.id}>

            {/* ── Desktop ── */}
            <div
              className={`hidden lg:flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all duration-150
                ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "bg-white hover:bg-accent/5"}
                ${isUnread ? "border-l-4 border-primary" : "border-l-4 border-transparent"}`}
              onClick={() => setSelectedNotification(notification)}
            >
              <div className={`p-2.5 rounded-full shrink-0 ${iconBg}`}>
                <Icon size={15} className={iconClr} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className={`text-accent text-sm truncate ${isUnread ? "font-bold" : "font-medium"}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {timeAgo(notification.created_at)}
                  </span>
                </div>
                <p className="text-slate-500 text-xs truncate">{preview}</p>
              </div>

              {isUnread && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              )}
            </div>

            {/* ── Mobile ── */}
            <div
              className={`lg:hidden bg-white rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-colors
                ${isUnread ? "border-l-4 border-primary" : "border-l-4 border-transparent"}
                hover:bg-accent/5`}
              onClick={() => {
                setSelectedNotification(notification);
                setMobileDetailOpen(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full shrink-0 ${iconBg}`}>
                    <Icon size={13} className={iconClr} />
                  </div>
                  <h4 className={`text-accent text-sm ${isUnread ? "font-bold" : "font-medium"}`}>
                    {notification.title}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{timeAgo(notification.created_at)}</span>
              </div>
              <p className="text-slate-500 text-xs truncate pl-9">{preview}</p>
            </div>

          </div>
        );
      })}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center mb-3">
            <Bell size={20} className="text-accent/30" />
          </div>
          <p className="text-accent/40 text-sm">No notifications yet.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationBar;
