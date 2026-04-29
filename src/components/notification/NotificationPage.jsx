"use client";

import Loader from "@/components/common/Loader";
import EmptyNotification from "@/components/notification/EmptyNotification";
import NotificationBar from "@/components/notification/NotificationBar";
import NotificationDetail from "@/components/notification/NotificationDetail";
import { fetchNotifications, markAllAsRead, markAsRead } from "@/lib/queries/notifications";
import { fetchUserProfile } from "@/lib/queries/projects";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase/client";
const supabase = getSupabaseClient();

const NotificationPage = () => {
  const btns = [
    { label: "All",             type: "all" },
    { label: "Project Updates", type: "project_update" },
    { label: "Assignments",     type: "assignment" },
  ];

  const [notifications, setNotifications]         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [active, setActive]                       = useState("All");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen]   = useState(false);
  const [profileId, setProfileId]                 = useState(null);

  useEffect(() => {
    let channel;
    async function load() {
      try {
        const profile = await fetchUserProfile();
        if (profile) {
          setProfileId(profile.id);
          const data = await fetchNotifications(profile.id);
          setNotifications(data || []);

          channel = supabase
            .channel(`notifications-page-${profile.id}`)
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
              (payload) => setNotifications((prev) => [payload.new, ...prev])
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
    return () => { if (channel) supabase.removeChannel(channel); };
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
    if (!profileId) return;
    try {
      await markAllAsRead(profileId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
    <main className="bg-secondary min-h-screen px-3 md:px-8 py-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-accent font-bold text-2xl md:text-3xl">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary font-semibold hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Main panel */}
      <div className="bg-tertiary grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 rounded-2xl">

        {/* Left — list */}
        <div className="lg:col-span-5 flex flex-col">

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {btns.map((btn) => (
              <button
                key={btn.label}
                onClick={() => setActive(btn.label)}
                className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all ${
                  active === btn.label
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-accent hover:bg-accent/5"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <NotificationBar
            notifications={filteredNotifications}
            setSelectedNotification={handleSelectNotification}
            setMobileDetailOpen={setMobileDetailOpen}
            selectedId={selectedNotification?.id}
          />
        </div>

        {/* Right — detail (desktop) */}
        <div className="hidden lg:block lg:col-span-7">
          <div className="bg-white rounded-2xl min-h-140 h-full">
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
      </div>

      {/* Mobile detail sheet */}
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
    </main>
  );
};

export default NotificationPage;
