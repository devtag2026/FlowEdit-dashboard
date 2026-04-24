"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ShieldCheck,
  CheckCircle2, AlertCircle, BellOff,
  Bell, User,
  Activity, Clock, FolderCheck,
} from "lucide-react";
import { fetchProfile, updateProfile } from "@/lib/queries/profile";
import { fetchClientProjects } from "@/lib/queries/projects";

// ─── constants ────────────────────────────────────────────────────────────────

const DEFAULT_NOTIF = {
  projectUpdates:      true,
  emailNotifications:  true,
  broadcastUpdates:    true,
  browserNotifications: false,
};

const NOTIF_OPTIONS = [
  { key: "projectUpdates",      label: "Project Updates",      description: "Get notified when your project status changes." },
  { key: "emailNotifications",  label: "Email Notifications",  description: "Receive email updates about your account activity." },
  { key: "broadcastUpdates",    label: "Broadcast Messages",   description: "Receive platform-wide announcements from the team." },
  { key: "browserNotifications",label: "Browser Notifications",description: "Show push notifications in your browser.", browser: true },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function askBrowserPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  const res = await Notification.requestPermission();
  return res;
}

function fireBrowserNotification(title, body) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/favicon.ico" });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ClientProfile() {
  const [profile, setProfile]     = useState(null);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null);

  const [notifications, setNotifications]     = useState(DEFAULT_NOTIF);
  const [savingKey, setSavingKey]             = useState(null);
  const [notifMsgs, setNotifMsgs]             = useState({});
  const [browserPerm, setBrowserPerm]         = useState("default");

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: { name: "" },
  });

  // ── load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const prof = await fetchProfile();
      setProfile(prof);
      setAvatarUrl(prof.avatar_url || null);
      reset({ name: prof.name || "" });
      if (prof.notification_preferences) {
        setNotifications({ ...DEFAULT_NOTIF, ...prof.notification_preferences });
      }
      const projs = await fetchClientProjects(prof.id).catch(() => []);
      setProjects(projs || []);
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    load();
    if (typeof window !== "undefined" && "Notification" in window) {
      setBrowserPerm(Notification.permission);
    } else {
      setBrowserPerm("unsupported");
    }
  }, [load]);

  // ── profile save ──────────────────────────────────────────────────────────
  const onSaveProfile = async (data) => {
    try {
      setProfileSaving(true);
      setProfileMsg(null);
      const updated = await updateProfile({ name: data.name.trim() });
      setProfile((p) => ({ ...p, ...updated }));
      reset({ name: updated.name || "" });
      setProfileMsg({ ok: true, text: "Profile saved successfully." });
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message || "Failed to save." });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── notification toggle ───────────────────────────────────────────────────
  const onToggle = async (key, checked, isBrowser) => {
    if (isBrowser && checked) {
      const perm = await askBrowserPermission();
      setBrowserPerm(perm);
      if (perm === "unsupported") {
        flashNotif(key, false, "Browser notifications are not supported here.");
        return;
      }
      if (perm !== "granted") {
        flashNotif(key, false, "Permission denied — allow notifications in your browser settings.");
        return;
      }
      fireBrowserNotification("Notifications enabled", "You'll receive browser notifications from FlowEdit.");
    }

    const next = { ...notifications, [key]: checked };
    setNotifications(next);

    try {
      setSavingKey(key);
      await updateProfile({ notification_preferences: next });
      flashNotif(key, true, "Saved");
    } catch (err) {
      setNotifications((p) => ({ ...p, [key]: !checked })); // revert
      flashNotif(key, false, err.message.includes("notification_preferences")
        ? "Column missing — run the SQL migration in Supabase."
        : "Failed to save.");
    } finally {
      setSavingKey(null);
    }
  };

  function flashNotif(key, ok, text, ms = 3500) {
    setNotifMsgs((p) => ({ ...p, [key]: { ok, text } }));
    setTimeout(() => setNotifMsgs((p) => ({ ...p, [key]: null })), ms);
  }

  // ── stats ─────────────────────────────────────────────────────────────────
  const active    = projects.filter((p) => ["submitted","in_progress","review"].includes(p.status)).length;
  const completed = projects.filter((p) => ["completed","ready_to_post","posted"].includes(p.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent">Account Settings</h1>
          <p className="text-sm text-accent/60 mt-1">Manage your profile and notification preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── sidebar ── */}
          <div className="lg:col-span-4 space-y-4">
            <ProfileCard
              name={profile?.name}
              email={profile?.email}
              avatarUrl={avatarUrl}
              memberSince={formatDate(profile?.created_at)}
              roleBadge={{ label: "Client", className: "bg-blue-100 text-blue-700" }}
            />

            <div className="bg-tertiary rounded-3xl p-5">
              <h3 className="text-xs font-semibold text-accent/50 uppercase mb-3">Projects</h3>
              <StatRow icon={Activity}    label="Total"     value={projects.length} />
              <StatRow icon={Clock}       label="Active"    value={active} />
              <StatRow icon={FolderCheck} label="Completed" value={completed} last />
            </div>

            <OAuthBadge />
          </div>

          {/* ── main ── */}
          <div className="lg:col-span-8 space-y-6">
            <PersonalInfoForm
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isDirty={isDirty}
              saving={profileSaving}
              msg={profileMsg}
              email={profile?.email}
              onSubmit={onSaveProfile}
            />

            <NotificationsCard
              options={NOTIF_OPTIONS}
              notifications={notifications}
              savingKey={savingKey}
              notifMsgs={notifMsgs}
              browserPerm={browserPerm}
              onToggle={onToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── shared sub-components ────────────────────────────────────────────────────

function ProfileCard({ name, email, avatarUrl, memberSince, roleBadge }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [avatarUrl]);

  return (
    <div className="bg-tertiary rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center ring-4 ring-white shadow-lg">
        {avatarUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="text-3xl font-bold text-accent/40 select-none">
            {name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div className="space-y-0.5 w-full">
        <h2 className="text-xl font-bold text-accent truncate">{name || "—"}</h2>
        <p className="text-sm text-accent/55 truncate">{email || "—"}</p>
      </div>

      {roleBadge && (
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleBadge.className}`}>
          {roleBadge.label}
        </span>
      )}

      <p className="text-xs text-accent/40">
        Member since{" "}
        <span className="font-medium text-accent/60">{memberSince || "—"}</span>
      </p>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${!last ? "border-b border-accent/8" : ""}`}>
      <div className="flex items-center gap-2.5 text-sm text-accent/65">
        <Icon className="w-4 h-4 text-accent/35" />
        {label}
      </div>
      <span className="text-sm font-bold text-accent">{value}</span>
    </div>
  );
}

function OAuthBadge() {
  return (
    <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3.5">
      <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-accent/70 leading-relaxed">
        Signed in via <strong>Google OAuth</strong>. Your email is managed by Google and cannot be changed here.
      </p>
    </div>
  );
}

function PersonalInfoForm({ register, handleSubmit, errors, isDirty, saving, msg, email, onSubmit }) {
  return (
    <div className="bg-tertiary rounded-3xl p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-accent">Personal Information</h3>
        <p className="text-sm text-accent/55">Update your display name.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-accent flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-accent/45" /> Full Name
          </Label>
          <Input
            placeholder="Enter your full name"
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
            className={`bg-white border-accent/20 text-accent placeholder:text-accent/30 focus:border-primary focus-visible:ring-0 h-11 ${errors.name ? "border-red-400" : ""}`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-accent">Email Address</Label>
          <div className="flex items-center gap-2 h-11 px-3 rounded-lg border border-accent/15 bg-accent/5">
            <span className="text-sm text-accent/55 flex-1 truncate">{email || "—"}</span>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold shrink-0">Google OAuth</span>
          </div>
          <p className="text-xs text-accent/40">Managed by Google — cannot be edited here.</p>
        </div>

        {msg && (
          <p className={`flex items-center gap-1.5 text-xs ${msg.ok ? "text-green-600" : "text-red-500"}`}>
            {msg.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {msg.text}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-accent/10">
          <p className="text-xs text-accent/40">{isDirty ? "You have unsaved changes." : "No pending changes."}</p>
          <Button type="submit" disabled={saving || !isDirty}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-10 disabled:opacity-50 gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function NotificationsCard({ options, notifications, savingKey, notifMsgs, browserPerm, onToggle }) {
  return (
    <div className="bg-tertiary rounded-3xl p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-accent">Notification Preferences</h3>
          <p className="text-sm text-accent/55">Each toggle saves instantly to your account in the database.</p>
        </div>
      </div>

      <div className="divide-y divide-accent/8">
        {options.map(({ key, label, description, browser }) => {
          const isSaving   = savingKey === key;
          const blocked    = browser && browserPerm === "denied";
          const unsupported = browser && browserPerm === "unsupported";
          const msg        = notifMsgs[key];

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
                    <span className="text-xs text-accent/40 bg-accent/10 px-2 py-0.5 rounded-full">Not supported</span>
                  )}
                </div>
                <p className="text-xs text-accent/50 mt-0.5">{description}</p>
                {blocked && (
                  <p className="text-xs text-amber-600 mt-1">
                    Allow notifications in your browser&apos;s site settings to enable this.
                  </p>
                )}
                {msg && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 ${msg.ok ? "text-green-600" : "text-red-500"}`}>
                    {msg.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {msg.text}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-accent/40" />}
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(v) => onToggle(key, v, !!browser)}
                  disabled={isSaving || unsupported}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
