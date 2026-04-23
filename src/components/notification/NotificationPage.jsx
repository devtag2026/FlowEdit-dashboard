"use client";

import Loader from "@/components/common/Loader";
import EmptyNotification from "@/components/notification/EmptyNotification";
import NotificationBar from "@/components/notification/NotificationBar";
import NotificationDetail from "@/components/notification/NotificationDetail";
import { fetchNotifications, markAllAsRead, markAsRead } from "@/lib/queries/notifications";
import { fetchUserProfile } from "@/lib/queries/projects";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase/client";
const supabase = getSupabaseClient()

const NotificationPage = () => {
  const btns = [
    { label: "All", type: "all" },
    { label: "Project Updates", type: "project_update" },
    { label: "Assignments", type: "assignment" },
  ];

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    let channel;
    async function load() {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          const data = await fetchNotifications(profile.id);
          setNotifications(data || []);

          // Subscribe to new notifications in realtime
          channel = supabase
            .channel("notifications-page")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
              (payload) => {
                setNotifications((prev) => [payload.new, ...prev]);
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    load();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSelectNotification = async (notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const profile = await fetchUserProfile();
      if (profile) {
        await markAllAsRead(profile.id);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const activeBtn = btns.find((b) => b.label === active);
  const filteredNotifications =
    activeBtn?.type === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeBtn?.type);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader />
      </div>
    );
  }

  return (
    <main className="bg-secondary px-3 md:px-8 py-5 pb-10">
      <div className="flex items-center justify-between pb-3">
        <h1 className="text-accent font-semibold text-2xl md:text-3xl">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary font-semibold hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-tertiary/90 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 rounded-xl">
        <div className="lg:col-span-6">
          {btns.map((btn) => (
            <button
              key={btn.label}
              onClick={() => setActive(btn.label)}
              className={`text-sm px-2 shadow-md md:px-4 py-1 rounded-lg mr-2 mt-4 cursor-pointer ${
                active === btn.label
                  ? "bg-primary text-white"
                  : "bg-white text-accent hover:bg-gray-300"
              }`}
            >
              {btn.label}
            </button>
          ))}

          <NotificationBar
            notifications={filteredNotifications}
            setSelectedNotification={handleSelectNotification}
            setMobileDetailOpen={setMobileDetailOpen}
            selectedId={selectedNotification?.id}
          />
        </div>

        <div className="hidden lg:block lg:col-span-6">
          <div className="relative bg-white rounded-3xl p-6 min-h-140">
            {selectedNotification ? (
              <NotificationDetail
                notification={selectedNotification}
                setSelectedNotification={setSelectedNotification}
              />
            ) : (
              <EmptyNotification />
            )}
          </div>
        </div>

        <div
          className={`
            lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-accent/10 rounded-t-3xl
            transition-transform duration-300 ease-out shadow-2xl
            ${mobileDetailOpen ? "translate-y-0" : "translate-y-full"}
          `}
          style={{ maxHeight: "85vh" }}
        >
          {selectedNotification && (
            <NotificationDetail
              notification={selectedNotification}
              isMobile={true}
              setMobileDetailOpen={setMobileDetailOpen}
            />
          )}
        </div>

        {mobileDetailOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-30"
            onClick={() => setMobileDetailOpen(false)}
          />
        )}
      </div>
    </main>
  );
};

export default NotificationPage;
