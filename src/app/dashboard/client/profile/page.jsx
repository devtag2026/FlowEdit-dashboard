"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { SettingsInput } from "@/components/Settings/SettingsInput";
import { SettingsToggle } from "@/components/Settings/SettingsToggle";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import Image from "next/image";
import { NotebookPenIcon, Loader2 } from "lucide-react";
import {
  fetchProfile,
  updateProfile,
  updateEmail,
  updatePassword,
  uploadAvatar,
  removeAvatar,
} from "@/lib/queries/profile";

export default function AccountSettings() {
  const [profile, setProfile]           = useState(null);
  const [avatarUrl, setAvatarUrl]       = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notifSaving, setNotifSaving]   = useState(false);
  const [profileMsg, setProfileMsg]     = useState(null); 
  const [passwordMsg, setPasswordMsg]   = useState(null);
  const [notifMsg, setNotifMsg]         = useState(null);
  const fileInputRef = useRef(null);

  const [notifications, setNotifications] = useState({
    projectUpdates:       true,
    emailNotifications:   true,
    browserNotifications: false,
    weeklyDigest:         true,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: { name: "", email: "", phone: "" },
  });

  const {
    register: registerSecurity,
    handleSubmit: handleSubmitSecurity,
    formState: { errors: securityErrors },
    watch,
    reset: resetSecurity,
    setError: setSecurityError,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword:     "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setAvatarUrl(data.avatar_url || null);
        resetProfile({
          name:  data.name  || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    load();
  }, [resetProfile]);

  const onSubmitProfile = async (data) => {
    try {
      setProfileSaving(true);
      setProfileMsg(null);

      const updated = await updateProfile({
        name:  data.name.trim(),
        phone: data.phone.trim(),
      });
      setProfile((prev) => ({ ...prev, ...updated }));


      if (data.email !== profile?.email) {
        await updateEmail(data.email.trim());
        setProfile((prev) => ({ ...prev, email: data.email.trim() }));
      }

      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const onSubmitSecurity = async (data) => {
    try {
      setPasswordSaving(true);
      setPasswordMsg(null);
      await updatePassword(data.newPassword);
      setPasswordMsg({ type: "success", text: "Password updated successfully." });
      resetSecurity();
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarLoading(true);
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarLoading(true);
      await removeAvatar();
      setAvatarUrl(null);
    } catch (err) {
      console.error("Remove avatar failed:", err);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setNotifSaving(true);
      setNotifMsg(null);
      await new Promise((r) => setTimeout(r, 500)); 
      setNotifMsg({ type: "success", text: "Notification preferences saved." });
    } catch (err) {
      setNotifMsg({ type: "error", text: "Failed to save preferences." });
    } finally {
      setNotifSaving(false);
    }
  };

  const StatusMsg = ({ msg }) => {
    if (!msg) return null;
    return (
      <p className={`text-sm mt-2 ${msg.type === "success" ? "text-green-600" : "text-red-500"}`}>
        {msg.text}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">Account Settings</h1>
          <p className="text-accent/70">Manage your profile and account preferences.</p>
        </div>

        <SettingsSection title="Profile" description="Update your profile photo.">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-accent/10 flex items-center justify-center">
                {avatarLoading ? (
                  <Loader2 className="animate-spin text-accent w-6 h-6" />
                ) : avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-accent/40">
                    {profile?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start flex-1 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={avatarLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-accent/20 text-accent hover:bg-primary/5 text-md font-onest shadow-accent/40 shadow-lg w-full sm:w-auto"
                >
                  {avatarLoading ? "Uploading..." : "Upload new photo"}
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={avatarLoading}
                    onClick={handleRemoveAvatar}
                    className="text-red-500 font-onest font-medium hover:bg-red-50 text-md w-full sm:w-auto"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs sm:text-sm font-onest text-accent/60 pt-4 max-w-md">
                Recommended: Square JPG, PNG, or GIF, at least 1000x1000 pixels.
              </p>
            </div>
          </div>
        </SettingsSection>

        <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
          <SettingsSection
            title="User Information"
            description="Update your name and personal details."
          >
            <div className="space-y-4">
              <SettingsInput
                label="Full Name"
                placeholder="Enter your full name"
                register={registerProfile("name", {
                  required: "Name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                error={profileErrors.name}
              />
              <SettingsInput
                label="Email Address"
                type="email"
                placeholder="your.email@example.com"
                register={registerProfile("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                error={profileErrors.email}
              />
              <SettingsInput
                label="Phone"
                type="tel"
                placeholder="+1 234 567 8900"
                register={registerProfile("phone", {
                  pattern: {
                    value: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                    message: "Invalid phone number",
                  },
                })}
                error={profileErrors.phone}
              />
            </div>

            <StatusMsg msg={profileMsg} />

            <div className="flex gap-3 justify-start pt-6 mt-6 border-t border-accent/10">
              <Button
                type="submit"
                disabled={profileSaving}
                className="hover:bg-primary bg-slate-700/10 text-accent hover:text-tertiary duration-500 disabled:opacity-60"
              >
                {profileSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </span>
                ) : "Save Profile"}
              </Button>
            </div>
          </SettingsSection>
        </form>

        <form onSubmit={handleSubmitSecurity(onSubmitSecurity)}>
          <SettingsSection
            title="Security"
            description="Manage your password and security settings."
          >
            <div className="space-y-4">
              <SettingsInput
                label="New Password"
                type="password"
                placeholder="Enter new password"
                register={registerSecurity("newPassword", {
                  required: "New password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                })}
                error={securityErrors.newPassword}
              />
              <SettingsInput
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                register={registerSecurity("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === watch("newPassword") || "Passwords do not match",
                })}
                error={securityErrors.confirmPassword}
              />
            </div>

            <StatusMsg msg={passwordMsg} />

            <div className="flex gap-3 justify-start pt-6 mt-6 border-t border-accent/10">
              <Button
                type="submit"
                disabled={passwordSaving}
                className="hover:bg-primary bg-slate-700/10 text-accent hover:text-tertiary duration-500 disabled:opacity-60"
              >
                {passwordSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </span>
                ) : "Update Password"}
              </Button>
            </div>
          </SettingsSection>
        </form>

        <SettingsSection
          title="Notifications"
          description="Manage your email and app notifications."
        >
          <div className="divide-y divide-accent/10">
            <SettingsToggle
              label="Project Updates"
              description="Get notified when there are changes to your projects."
              checked={notifications.projectUpdates}
              onChange={(checked) =>
                setNotifications({ ...notifications, projectUpdates: checked })
              }
            />
            <SettingsToggle
              label="Email Notifications"
              description="Receive email updates about your account activity."
              checked={notifications.emailNotifications}
              onChange={(checked) =>
                setNotifications({ ...notifications, emailNotifications: checked })
              }
            />
            <SettingsToggle
              label="Browser Notifications"
              description="Get browser push notifications for important updates."
              checked={notifications.browserNotifications}
              onChange={(checked) =>
                setNotifications({ ...notifications, browserNotifications: checked })
              }
            />
          </div>

          <StatusMsg msg={notifMsg} />
        </SettingsSection>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center sm:justify-end border-t border-accent/10 pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-accent/20 text-accent hover:bg-accent/5 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <div className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 rounded-2xl px-4 py-3 sm:px-3 sm:py-2 w-full sm:w-auto">
            <NotebookPenIcon className="text-white w-4 h-4" />
            <Button
              type="button"
              disabled={notifSaving}
              onClick={handleSaveNotifications}
              className="text-sm text-white p-0 h-auto bg-transparent hover:bg-transparent disabled:opacity-60"
            >
              {notifSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}