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

// Strip HTML tags for list preview — full HTML renders in NotificationDetail
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
  broadcast:      Megaphone,   // ← broadcast icon
};

const NotificationBar = ({
  notifications,
  setSelectedNotification,
  setMobileDetailOpen,
  selectedId,
}) => {
  return (
    <div className="space-y-3 mt-4">
      {notifications.map((notification) => {
        const Icon      = typeToIcon[notification.type] || MessageCircle;
        const isSelected = selectedId === notification.id;
        // Plain text preview — no HTML tags in the list
        const preview   = stripHtml(notification.message);

        return (
          <div key={notification.id}>

            {/* ── Desktop ── */}
            <div
              className={`hidden lg:flex bg-white rounded-lg p-3 justify-between hover:bg-accent/10 cursor-pointer overflow-hidden ${
                isSelected ? "ring-2 ring-primary/40" : ""
              } ${!notification.is_read ? "border-l-4 border-l-primary" : ""}`}
              onClick={() => setSelectedNotification(notification)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="bg-primary p-3 rounded-full shrink-0">
                  <Icon size={18} className="text-white" />
                </div>

                <div className="flex flex-col min-w-0">
                  <h4 className={`text-accent text-lg mb-1 truncate ${!notification.is_read ? "font-bold" : "font-medium"}`}>
                    {notification.title}
                  </h4>
                  {/* preview — HTML stripped, truncated */}
                  <p className="text-slate-600 text-sm truncate">
                    {preview}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500 whitespace-nowrap ml-3 self-center">
                {timeAgo(notification.created_at)}
              </span>
            </div>

            {/* ── Mobile ── */}
            <div
              className={`lg:hidden bg-white rounded-xl p-4 flex flex-col hover:bg-gray-200 cursor-pointer ${
                !notification.is_read ? "border-l-4 border-l-primary" : ""
              }`}
              onClick={() => {
                setSelectedNotification(notification);
                setMobileDetailOpen(true);
              }}
            >
              <span className="text-xs text-slate-600 whitespace-nowrap">
                {timeAgo(notification.created_at)}
              </span>
              <h4 className={`text-accent text-lg mb-1 ${!notification.is_read ? "font-bold" : "font-medium"}`}>
                {notification.title}
              </h4>
              {/* preview — HTML stripped, truncated */}
              <p className="text-slate-600 text-sm truncate">
                {preview}
              </p>
            </div>

          </div>
        );
      })}

      {notifications.length === 0 && (
        <div className="text-center py-12 text-accent/40 text-sm">
          No notifications yet.
        </div>
      )}
    </div>
  );
};

export default NotificationBar;