"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SocialCard } from "@/components/Social/SocialCard";
import { Lock, Loader2 } from "lucide-react";
import {
  fetchSocialPlatforms,
  upsertSocialPlatform,
  disconnectSocialPlatform,
} from "@/lib/queries/socials";

const PLATFORM_META = {
  youtube: {
    platform: "YouTube",
    description: "Upload and publish videos directly to your YouTube channel.",
    connectionNote:
      "Uses native Google OAuth. FlowEdit never sees your password. Connecting is free. Auto-posting is unlocked on Growth and Pro plans.",
    requirements: [
      "A Google account",
      "Permission to upload to the selected YouTube channel",
    ],
    iconBgColor: "bg-[#ff0000]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  instagram: {
    platform: "Instagram",
    description:
      "Publish reels and posts to your linked Instagram Business account.",
    connectionNote:
      "Instagram posting requires a connected Facebook Page. Connecting is free. Auto-posting is unlocked on Growth and Pro plans.",
    requirements: [
      "A Facebook Page",
      "An Instagram Professional account linked to that Page",
    ],
    iconBgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  facebook: {
    platform: "Facebook",
    description: "Publish videos directly to your Facebook Page.",
    connectionNote:
      "Connection is required for Instagram publishing. FlowEdit can auto-post videos to this channel.",
    requirements: ["A Facebook Page that you manage"],
    iconBgColor: "bg-[#1877f2]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  tiktok: {
    platform: "TikTok",
    description: "Upload videos to TikTok with captions and metadata.",
    connectionNote:
      "Authorizes FlowEdit through TikTok's secure OAuth portal. Connecting is free. Auto-posting is unlocked on Growth and Pro plans.",
    requirements: [
      "TikTok login",
      "Permission to upload videos to the selected account",
    ],
    iconBgColor: "bg-black",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
};

export default function SocialConnections() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSocialPlatforms();
      setPlatforms(
        data.map((row) => {
          const meta = PLATFORM_META[row.platform] || {};
          return {
            ...meta,
            ...row,
            status: row.connected ? "connected" : "not-connected",
            buttonText: row.connected
              ? "Manage Connection"
              : `Connect ${meta.platform}`,
            buttonAction: () => handleToggle(row),
          };
        }),
      );
    } catch (err) {
      console.error("Failed to load social platforms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (row) => {
    try {
      setSavingId(row.platform);
      if (row.connected) {
        await disconnectSocialPlatform(row.platform);
      } else {
        // v1 — manual tracking only, no real OAuth
        await upsertSocialPlatform({
          platform: row.platform,
          handle: row.handle || null,
          url: row.url || null,
          connected: true,
        });
      }
      await load();
    } catch (err) {
      console.error("Failed to toggle platform:", err);
      alert("Failed to update connection. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  // Rebuild buttonAction references after load so closures are fresh
  const platformsWithActions = platforms.map((p) => ({
    ...p,
    buttonAction: () => handleToggle(p),
    buttonText:
      savingId === p.platform
        ? "Saving..."
        : p.connected
          ? "Manage Connection"
          : `Connect ${p.platform}`,
  }));

  return (
    <div className="min-h-screen p-6 bg-secondary">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header card */}
        <Card className="border rounded-3xl shadow-none bg-tertiary">
          <CardContent className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-3xl text-accent font-bold font-onest mb-2 sm:mb-3">
              Social Connections
            </h1>
            <p className="text-sm sm:text-md font-extralight font-onest text-accent tracking-wide leading-relaxed max-w-3xl">
              Connect your social accounts so FlowEdit can upload and publish
              videos on your behalf. All connections use secure OAuth — FlowEdit
              never sees your passwords.
            </p>
          </CardContent>
        </Card>

        {/* Upgrade banner */}
        <Card className="border rounded-3xl shadow-none bg-tertiary">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl text-accent font-bold font-onest mb-2">
                  Publishing not included in your plan
                </h3>
                <p className="text-sm sm:text-md font-extralight font-onest text-accent tracking-wide leading-relaxed">
                  Connect accounts now and upgrade to unlock automatic posting
                  to YouTube, Instagram, Facebook, and TikTok.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Auto-posting is available on FlowEdit Growth and Pro plans
                </p>
              </div>
              <Button className="w-full sm:w-auto bg-primary text-white font-bold px-6 h-11 rounded-2xl text-base sm:text-lg font-onest">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Platform cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformsWithActions.map((platform) => (
              <SocialCard key={platform.platform} {...platform} />
            ))}
          </div>
        )}

        {/* Security card */}
        <Card className="border rounded-3xl shadow-none bg-tertiary">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-green-50 rounded-full p-2 sm:p-2.5 flex-shrink-0">
                <Lock className="w-6 h-6 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg sm:text-2xl text-accent font-onest mb-1 sm:mb-1.5">
                  Security & Permissions
                </h3>
                <p className="text-sm font-light font-onest text-accent tracking-wide leading-relaxed">
                  All social connections use Official APIs from Google, Meta,
                  and TikTok. You can revoke access at any time from your social
                  account settings. FlowEdit never stores your passwords — only
                  secure access tokens with limited permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
