import { fetchBroadcasts } from "@/lib/queries/broadcast";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase/client";
const supabase = getSupabaseClient()

const AUDIENCE_COLORS = {
  Contractors: "bg-primary/10 text-primary",
  Clients:     "bg-[#ec4899]/10 text-[#ec4899]",
  Management:  "bg-[#f59e0b]/10 text-[#f59e0b]",
  All:         "bg-accent/10 text-accent",
};

function deriveAudience(recipients) {
  if (!recipients || recipients.length === 0) return "All";
  const roles = [...new Set(recipients.map((r) => r.profile?.role).filter(Boolean))];
  if (roles.length !== 1) return "All";
  const map = { contractor: "Contractors", client: "Clients", admin: "Management" };
  return map[roles[0]] || "All";
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function normalise(b) {
  const audience = deriveAudience(b.recipients);
  const views    = (b.recipients || []).filter((r) => r.read_at).length;
  return {
    ...b,
    content:       b.message,
    audience,
    audienceColor: AUDIENCE_COLORS[audience] || AUDIENCE_COLORS.All,
    priority:      "Active",
    priorityColor: "bg-green-100 text-green-700",
    status:        "sent",
    sentAt:        timeAgo(b.created_at),
    views,
    recipients:    audience,
  };
}

/**
 * useBroadcasts
 *
 * Fetches all broadcasts on mount, then subscribes to Supabase Realtime
 * on the `broadcasts` table. Any INSERT, UPDATE or DELETE automatically
 * re-fetches so the UI is always in sync — no manual refresh needed.
 */
export function useBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBroadcasts();
      setBroadcasts(data.map(normalise));
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    load();

    // Subscribe to any change on the broadcasts table
    const channel = supabase
      .channel("broadcasts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broadcasts" },
        (payload) => {
          console.log("[Realtime] broadcasts change:", payload.eventType);
          // Re-fetch on any change so we always have fresh data + recipients
          load();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] broadcasts subscription:", status);
      });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { broadcasts, loading, reload: load };
}
