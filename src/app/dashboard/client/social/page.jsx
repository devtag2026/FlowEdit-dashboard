"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, Loader2, Tv2 } from "lucide-react";
import { fetchSocialPlatforms } from "@/lib/queries/socials";
import { fetchUserProfile } from "@/lib/queries/projects";

const PLATFORM_META = {
  youtube: {
    label: "YouTube",
    description: "Upload and publish videos directly to your YouTube channel.",
    iconBgColor: "bg-[#ff0000]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    description: "Publish reels and posts to your Instagram Business account.",
    iconBgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    description: "Publish videos directly to your Facebook Page.",
    iconBgColor: "bg-[#1877f2]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    description: "Upload videos to TikTok with captions and metadata.",
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
  const [socialAccess, setSocialAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [platformData, profile] = await Promise.all([
        fetchSocialPlatforms(),
        fetchUserProfile(),
      ]);
      const access = profile?.social_access || {};
      setSocialAccess(access);
      setPlatforms(platformData);
    } catch (err) {
      console.error("Failed to load social platforms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const enabledPlatforms = platforms
    .filter((p) => !!socialAccess?.[p.platform])
    .map((p) => ({ ...p, ...(PLATFORM_META[p.platform] || {}) }));

  const hasAnyAccess = socialAccess && Object.values(socialAccess).some(Boolean);

  return (
    <div className="min-h-screen p-6 bg-secondary">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <Card className="border rounded-3xl shadow-none bg-tertiary">
          <CardContent className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-3xl text-accent font-bold font-onest mb-2 sm:mb-3">
              Social Connections
            </h1>
            <p className="text-sm sm:text-md font-extralight font-onest text-accent tracking-wide leading-relaxed max-w-3xl">
              The platforms below have been enabled for your account by your
              admin. FlowEdit can post content to these channels on your behalf.
            </p>
          </CardContent>
        </Card>

        {/* Platform cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : !hasAnyAccess ? (
          <Card className="border rounded-3xl shadow-none bg-tertiary">
            <CardContent className="p-8 sm:p-12 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                <Tv2 className="w-7 h-7 text-accent/40" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-accent mb-1">
                  No platforms configured
                </h3>
                <p className="text-sm text-accent/50 max-w-sm">
                  No social platforms have been enabled for your account yet.
                  Contact your admin to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enabledPlatforms.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.platform}
                  className="bg-tertiary rounded-3xl p-5 flex flex-col gap-4 border border-accent/10"
                >
                  {/* Top row: icon + name + access badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`${p.iconBgColor} rounded-2xl w-12 h-12 shrink-0 flex items-center justify-center`}
                      >
                        {Icon && <Icon className="w-6 h-6 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-accent text-base leading-tight">
                          {p.label}
                        </p>
                        <p className="text-xs text-accent/50 mt-0.5 leading-snug line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {/* Admin access badge */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 rounded-full px-2.5 py-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold whitespace-nowrap">
                        Access Granted
                      </span>
                    </div>
                  </div>

                  {p.connected && (
                    <>
                      <div className="border-t border-accent/8" />
                      <div className="flex items-center gap-2.5">
                        <div>
                          <p className="text-sm font-semibold text-accent">
                            Connected
                          </p>
                          <p className="text-xs text-accent/50">
                            FlowEdit is active on this channel
                          </p>
                        </div>
                        <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
