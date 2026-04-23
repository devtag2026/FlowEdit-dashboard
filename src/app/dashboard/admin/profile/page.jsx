"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { SettingsInput } from "@/components/Settings/SettingsInput";
import { SettingsToggle } from "@/components/Settings/SettingsToggle";
import { SettingsSection } from "@/components/Settings/SettingsSection";
import Image from "next/image";
import { NotebookPenIcon } from "lucide-react";

export default function AccountSettings() {
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 234 567 8900",
    },
  });

  const {
    register: registerSecurity,
    handleSubmit: handleSubmitSecurity,
    formState: { errors: securityErrors },
    watch,
    reset: resetSecurity,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [notifications, setNotifications] = useState({
    projectUpdates: true,
    emailNotifications: true,
    browserNotifications: false,
    weeklyDigest: true,
  });

  const onSubmitProfile = (data) => {
    console.log("Profile Data:", data);
    alert("Profile updated successfully!");
  };

  const onSubmitSecurity = (data) => {
    console.log("Security Data:", data);
    alert("Password updated successfully!");
    resetSecurity();
  };

  const handleSaveNotifications = () => {
    console.log("Notifications:", notifications);
    alert("Notification preferences saved!");
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">
            Account Settings
          </h1>
          <p className="text-accent/70">
            Manage your profile and account preferences.
          </p>
        </div>

        <SettingsSection
          title="Profile"
          description="Update your profile and personal details."
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-linear-to from-primary to-secondary overflow-hidden">
                <Image
                  width={200}
                  height={200}
                  src="https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start flex-1 text-center lg:text-left">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-accent/20 text-accent hover:bg-primary/5 text-md font-onest shadow-accent/40 shadow-lg w-full sm:w-auto"
                >
                  Upload new photo
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-danger font-onest font-medium hover:text-danger hover:bg-accent text-md w-8 sm:w-auto"
                >
                  Remove
                </Button>
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
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
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
                  required: "Phone is required",
                  pattern: {
                    value:
                      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                    message: "Invalid phone number",
                  },
                })}
                error={profileErrors.phone}
              />
            </div>

            <div className="flex gap-3 justify-start pt-6 mt-6 border-t border-accent/10">
              <Button
                type="submit"
                className="hover:bg-primary bg-slate-700/10 text-accent hover:text-tertiary duration-500"
              >
                Save Profile
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
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                register={registerSecurity("currentPassword", {
                  required: "Current password is required",
                })}
                error={securityErrors.currentPassword}
              />
              <SettingsInput
                label="New Password"
                type="password"
                placeholder="Enter new password"
                register={registerSecurity("newPassword", {
                  required: "New password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
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

            <div className="flex gap-3 justify-start pt-6 mt-6 border-t border-accent/10">
              <Button
                type="submit"
                className="hover:bg-primary bg-slate-700/10 text-accent hover:text-tertiary duration-500"
              >
                Update Password
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
                setNotifications({
                  ...notifications,
                  emailNotifications: checked,
                })
              }
            />
            <SettingsToggle
              label="Browser Notifications"
              description="Get browser push notifications for important updates."
              checked={notifications.browserNotifications}
              onChange={(checked) =>
                setNotifications({
                  ...notifications,
                  browserNotifications: checked,
                })
              }
            />
          </div>
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
              onClick={handleSaveNotifications}
              className="text-sm text-white p-0 h-auto bg-transparent hover:bg-transparent"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
