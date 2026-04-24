"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bell,
  User,
  BellOff,
  LayoutDashboard,
  Users,
  Megaphone,
  FolderOpen,
} from "lucide-react";
import {
  fetchProfile,
  updateProfile,
} from "@/lib/queries/profile";
import { fetchAdminStats } from "@/lib/queries/projects";
import { fetchBroadcasts } from "@/lib/queries/broadcast";
import { fetchContractors } from "@/lib/queries/contractors";

const DEFAULT_NOTIF = {
  newProjectSubmitted: true,
  contractorActivity: true,
  clientActivity: true,
  broadcastActivity: false,
  emailNotifications: true,
  browserNotifications: false,
};

const NOTIF_OPTIONS = [
  {
    key: "newProjectSubmitted",
    label: "New Project Submissions",
    description: "Get notified when a client submits a new project.",
  },
  {
    key: "contractorActivity",
    label: "Contractor Activity",
    description: "Updates when contractors submit or update work.",
  },
  {
    key: "clientActivity",
    label: "Client Activity",
    description: "Updates when clients approve, comment, or request changes.",
  },
  {
    key: "broadcastActivity",
    label: "Broadcast Confirmations",
    description: "Confirm when a broadcast is successfully sent.",
  },
  {
    key: "emailNotifications",
    label: "Email Notifications",
    description: "Receive email digests for account activity.",
  },
  {
    key: "browserNotifications",
    label: "Browser Notifications",
    description: "Show push notifications in your browser for critical events.",
    requiresPermission: true,
  },
];

function formatMemberSince(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function requestBrowserPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showBrowserNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/favicon.ico" });
}

const InlineFeedback = ({ msg }) => {
  if (!msg) return null;
  const ok = msg.type === "success";
  return (
    <p className={`flex items-center gap-1.5 text-xs mt-1.5 ${ok ? "text-green-600" : "text-red-500"}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {msg.text}
    </p>
  );
};

export default function AdminAccountSettings() {
  const [profile, setProfile]             = useState(null);
  const [adminStats, setAdminStats]       = useState(null);
  const [broadcastCount, setBroadcastCount] = useState(0);
  const [contractorCount, setContractorCount] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [avatarUrl, setAvatarUrl]         = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIF);
  const [savingKey, setSavingKey]         = useState(null);
  const [notifMsgs, setNotifMsgs]         = useState({});
  const [browserPermission, setBrowserPermission] = useState("default");
  const [avatarImgError, setAvatarImgError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: { name: "" } });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [profileData, stats, broadcasts, contractors] = await Promise.all([
        fetchProfile(),
        fetchAdminStats(),
        fetchBroadcasts(),
        fetchContractors(),
      ]);
      setProfile(profileData);
      setAvatarUrl(profileData.avatar_url || null);
      setAvatarImgError(false);
      reset({ name: profileData.name || "" });
      if (profileData.notification_preferences) {
        setNotifications({ ...DEFAULT_NOTIF, ...profileData.notification_preferences });
      }
      setAdminStats(stats);
      setBroadcastCount(broadcasts.length);
      setContractorCount(contractors.length);
    } catch (err) {
      console.error("Failed to load admin profile:", err);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    load();
    if (!("Notification" in window)) {
      setBrowserPermission("unsupported");
    } else {
      setBrowserPermission(Notification.permission);
    }
  }, [load]);

  const onSubmitProfile = async (data) => {
    try {
      setProfileSaving(true);
      setProfileMsg(null);
      const updated = await updateProfile({ name: data.name.trim() });
      setProfile((prev) => ({ ...prev, ...updated }));
      reset({ name: updated.name || "" });
      setProfileMsg({ type: "success", text: "Profile saved successfully." });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleToggle = async (key, checked) => {
    if (key === "browserNotifications") {
      if (checked) {
        if (browserPermission === "unsupported") {
          setNotifMsgs((p) => ({ ...p, [key]: { type: "error", text: "Not supported in this browser." } }));
          setTimeout(() => setNotifMsgs((p) => ({ ...p, [key]: null })), 3000);
          return;
        }
        if (browserPermission === "denied") {
          setNotifMsgs((p) => ({ ...p, [key]: { type: "error", text: "Blocked — enable in browser site settings." } }));
          setTimeout(() => setNotifMsgs((p) => ({ ...p, [key]: null })), 5000);
          return;
        }
        const granted = await requestBrowserPermission();
        setBrowserPermission(granted ? "granted" : "denied");
        if (!granted) {
          setNotifMsgs((p) => ({ ...p, [key]: { type: "error", text: "Permission denied." } }));
          setTimeout(() => setNotifMsgs((p) => ({ ...p, [key]: null })), 5000);
          return;
        }
        showBrowserNotification("Notifications enabled", "You'll now receive admin browser notifications.");
      }
    }

    const next = { ...notifications, [key]: checked };
    setNotifications(next);
    try {
      setSavingKey(key);
      await updateProfile({ notification_preferences: next });
      setNotifMsgs((p) => ({ ...p, [key]: { type: "success", text: "Saved" } }));
    } catch (err) {
      setNotifications((p) => ({ ...p, [key]: !checked }));
      const msg = err?.message?.includes("notification_preferences")
        ? "Column missing — run the SQL migration in Supabase."
        : "Failed to save.";
      setNotifMsgs((p) => ({ ...p, [key]: { type: "error", text: msg } }));
    } finally {
      setSavingKey(null);
      setTimeout(() => setNotifMsgs((p) => ({ ...p, [key]: null })), 3000);
    }
  };


  const stats = [
    { icon: FolderOpen,     label: "Total Projects",  value: adminStats?.total ?? "—"            },
    { icon: LayoutDashboard, label: "Active Projects", value: adminStats?.active ?? "—"           },
    { icon: Users,          label: "Contractors",      value: contractorCount                     },
    { icon: Megaphone,      label: "Broadcasts Sent",  value: broadcastCount                      },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const memberSince = formatMemberSince(profile?.created_at);

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent">Account Settings</h1>
          <p className="text-sm text-accent/60 mt-1">Manage your admin profile and notification preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">

            {/* Profile card */}
            <div className="bg-tertiary rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center ring-4 ring-white shadow-lg">
                {avatarUrl && !avatarImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" onError={() => setAvatarImgError(true)} />
                ) : (
                  <span className="text-3xl font-bold text-accent/40 select-none">
                    {profile?.name?.[0]?.toUpperCase() || "A"}
                  </span>
                )}
              </div>

              <div className="space-y-0.5 w-full">
                <h2 className="text-xl font-bold text-accent truncate">{profile?.name || "—"}</h2>
                <p className="text-sm text-accent/55 truncate">{profile?.email || "—"}</p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700">
                Admin
              </span>

              <p className="text-xs text-accent/40">
                Member since{" "}
                <span className="font-medium text-accent/60">{memberSince || "—"}</span>
              </p>
            </div>

            {/* Platform stats */}
            <div className="bg-tertiary rounded-3xl p-5">
              <h3 className="text-xs font-semibold text-accent/50 uppercase mb-3">Platform Overview</h3>
              <div className="space-y-1">
                {stats.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-accent/8 last:border-0">
                    <div className="flex items-center gap-2.5 text-sm text-accent/65">
                      <Icon className="w-4 h-4 text-accent/35" />
                      {label}
                    </div>
                    <span className="text-sm font-bold text-accent">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-accent/70 leading-relaxed">
                Signed in via <strong>Google OAuth</strong>. Your email is managed by Google and cannot be changed here.
              </p>
            </div>
          </div>

          {/* Main column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Personal info */}
            <div className="bg-tertiary rounded-3xl p-6">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-accent">Personal Information</h3>
                <p className="text-sm text-accent/55">Update your display name.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-accent flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-accent/45" />
                    Full Name
                  </Label>
                  <Input
                    placeholder="Enter your full name"
                    {...register("name", {
                      required: "Name is required",
                      minLength: { value: 2, message: "At least 2 characters required" },
                    })}
                    className={`bg-white border-accent/20 text-accent placeholder:text-accent/30 focus:border-primary focus-visible:ring-0 h-11 ${errors.name ? "border-red-400" : ""}`}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-accent">Email Address</Label>
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-accent/15 bg-accent/5">
                    <span className="text-sm text-accent/55 flex-1 truncate">{profile?.email || "—"}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                      Google OAuth
                    </span>
                  </div>
                  <p className="text-xs text-accent/40">Managed by your Google account — cannot be edited here.</p>
                </div>

                <InlineFeedback msg={profileMsg} />

                <div className="flex items-center justify-between pt-3 border-t border-accent/10">
                  <p className="text-xs text-accent/40">
                    {isDirty ? "You have unsaved changes." : "No pending changes."}
                  </p>
                  <Button
                    type="submit"
                    disabled={profileSaving || !isDirty}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-10 disabled:opacity-50 gap-2"
                  >
                    {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Notifications */}
            <div className="bg-tertiary rounded-3xl p-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-accent">Notification Preferences</h3>
                  <p className="text-sm text-accent/55">Each toggle saves instantly to your account.</p>
                </div>
              </div>

              <div className="divide-y divide-accent/8">
                {NOTIF_OPTIONS.map(({ key, label, description }) => {
                  const isDisabled = savingKey === key;
                  const isBrowser  = key === "browserNotifications";
                  const blocked    = isBrowser && browserPermission === "denied";
                  const unsupported = isBrowser && browserPermission === "unsupported";

                  return (
                    <div key={key} className="flex items-start justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-accent">{label}</p>
                          {blocked && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <BellOff className="w-3 h-3" /> Blocked
                            </span>
                          )}
                          {unsupported && (
                            <span className="text-xs text-accent/40 bg-accent/8 px-2 py-0.5 rounded-full">Not supported</span>
                          )}
                        </div>
                        <p className="text-xs text-accent/50 mt-0.5">{description}</p>
                        {blocked && (
                          <p className="text-xs text-amber-600 mt-1">Enable notifications in your browser&apos;s site settings.</p>
                        )}
                        {notifMsgs[key] && (
                          <p className={`text-xs mt-1.5 flex items-center gap-1 ${notifMsgs[key].type === "success" ? "text-green-600" : "text-red-500"}`}>
                            {notifMsgs[key].type === "success"
                              ? <CheckCircle2 className="w-3 h-3" />
                              : <AlertCircle className="w-3 h-3" />}
                            {notifMsgs[key].text}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {isDisabled && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent/40" />}
                        <Switch
                          checked={notifications[key]}
                          onCheckedChange={(checked) => handleToggle(key, checked)}
                          disabled={isDisabled || unsupported}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
