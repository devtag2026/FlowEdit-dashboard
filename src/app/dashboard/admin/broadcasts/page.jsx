"use client";
import { useState } from "react";
import EmptyBroadcastDetail from "@/components/broadcasts/EmptyBroadcast";
import BroadcastDetail from "@/components/broadcasts/BroadcastsDetail";
import { createBroadcast } from "@/lib/queries/broadcast";
import { useBroadcasts } from "@/hooks/admin/useBroadcast";
import {
  Plus, Search, Eye, ChevronUp, Megaphone, BarChart2,
  Clock, Users, ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewBroadcast from "@/components/broadcasts/NewBroadcast";
import Loader from "@/components/common/Loader";
import { filters } from "@/constants/admin/broadcast";

const AUDIENCE_ICON = {
  Contractors: { bg: "bg-primary/10",  icon: "text-primary"   },
  Clients:     { bg: "bg-pink-100",    icon: "text-pink-500"  },
  All:         { bg: "bg-slate-100",   icon: "text-slate-500" },
};

function BroadcastCard({ broadcast, isSelected, onClick }) {
  const iconStyle  = AUDIENCE_ICON[broadcast.audience] || AUDIENCE_ICON.All;
  const isScheduled = broadcast.status === "scheduled";
  const preview    = broadcast.content?.replace(/<[^>]*>/g, "").trim() || "";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-3.5 transition-all border ${
        isSelected
          ? "bg-primary/8 border-primary/20 shadow-sm"
          : "bg-secondary border-transparent hover:border-accent/10 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon avatar */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isScheduled ? "bg-amber-100" : iconStyle.bg
        }`}>
          {isScheduled
            ? <Clock className="w-4 h-4 text-amber-500" />
            : <Megaphone className={`w-4 h-4 ${iconStyle.icon}`} />
          }
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`text-sm font-semibold leading-tight truncate ${
              isSelected ? "text-primary" : "text-accent"
            }`}>
              {broadcast.title}
            </span>
            <span className="text-[10px] text-accent/40 shrink-0 mt-px font-medium">
              {isScheduled
                ? broadcast.scheduledFor?.split(",")[0] || "Soon"
                : broadcast.sentAt}
            </span>
          </div>

          {preview && (
            <p className="text-xs text-accent/50 line-clamp-2 leading-relaxed mb-2.5">
              {preview}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${broadcast.audienceColor}`}>
              {broadcast.audience}
            </span>
            {isScheduled ? (
              <span className="text-[10px] text-amber-500 font-medium bg-amber-50 px-1.5 py-0.5 rounded-md">
                Scheduled
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-accent/40">
                <Eye className="w-2.5 h-2.5" />
                {broadcast.views} seen
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function BroadcastsPage() {
  const { broadcasts, loading, reload } = useBroadcasts();

  const [creating, setCreating]                   = useState(false);
  const [activeFilter, setActiveFilter]           = useState("All");
  const [searchQuery, setSearchQuery]             = useState("");
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen]   = useState(false);
  const [sortOrder, setSortOrder]                 = useState("Newest First");
  const [newBroadCast, setNewBroadCast]           = useState(false);

  const filteredBroadcasts = broadcasts.filter((b) => {
    const matchesFilter = activeFilter === "All" || activeFilter === b.audience;
    const q = searchQuery.toLowerCase();
    return matchesFilter && (
      b.title?.toLowerCase().includes(q) ||
      b.content?.toLowerCase().includes(q)
    );
  });

  const sortedBroadcasts = [...filteredBroadcasts].sort((a, b) => {
    const diff = new Date(b.created_at) - new Date(a.created_at);
    return sortOrder === "Newest First" ? diff : -diff;
  });

  const scheduledBroadcasts = sortedBroadcasts.filter((b) => b.status === "scheduled");
  const sentBroadcasts      = sortedBroadcasts.filter((b) => b.status === "sent");

  const handleNewBroadCast = () => {
    setSelectedBroadcast(null);
    setNewBroadCast(true);
    setMobileDetailOpen(true);
  };

  const handleBroadcastSelect = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setNewBroadCast(false);
    setMobileDetailOpen(true);
  };

  const handleBackToList = () => {
    setSelectedBroadcast(null);
    setMobileDetailOpen(false);
  };

  const handleCreate = async ({ title, message, audience, scheduledFor }) => {
    try {
      setCreating(true);
      await createBroadcast({ title, message, audience, scheduledFor });
      reload();
      setNewBroadCast(false);
      setMobileDetailOpen(false);
    } catch (err) {
      console.error("Failed to create broadcast:", err);
      alert("Failed to send broadcast. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const totalViews      = broadcasts.reduce((sum, b) => sum + (b.views ?? 0), 0);
  const totalRecipients = broadcasts.reduce((sum, b) => sum + (b.recipientCount ?? 0), 0);
  const engagementRate  = totalRecipients > 0
    ? Math.round((totalViews / totalRecipients) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-accent">Broadcasts</h1>
            <p className="text-sm text-accent/50 mt-1">
              Send announcements and updates to your users
            </p>
          </div>
          <Button
            onClick={handleNewBroadCast}
            className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl px-4 h-10 text-sm font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Broadcast
          </Button>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total Broadcasts",
              value: broadcasts.length,
              icon: Megaphone,
              iconBg: "bg-primary/10",
              iconColor: "text-primary",
              sub: `${scheduledBroadcasts.length} scheduled`,
            },
            {
              label: "Total Views",
              value: totalViews,
              icon: Eye,
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
              sub: `across ${broadcasts.filter(b => b.status === "sent").length} sent`,
            },
            {
              label: "Engagement Rate",
              value: `${engagementRate}%`,
              icon: BarChart2,
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
              sub: `${totalRecipients} total recipients`,
            },
          ].map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
            <div key={label} className="bg-tertiary rounded-2xl p-4 sm:p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-accent/45 font-semibold uppercase tracking-wider truncate">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-accent leading-tight">{value}</p>
                <p className="text-[10px] text-accent/35 mt-0.5 truncate">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main 2-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

          {/* ══ Inbox panel ══ */}
          <div className="lg:col-span-4 flex flex-col bg-tertiary rounded-3xl overflow-hidden">

            {/* Search bar */}
            <div className="px-4 pt-4 pb-3 border-b border-accent/8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/30 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search broadcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-secondary border-0 text-accent text-sm placeholder:text-accent/30 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
                />
              </div>
            </div>

            {/* Segmented filter control */}
            <div className="px-4 py-3 border-b border-accent/8">
              <div className="flex rounded-xl bg-secondary p-0.5 gap-0.5">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
                      activeFilter === f
                        ? "bg-white text-accent shadow-sm"
                        : "text-accent/45 hover:text-accent"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Section header + sort */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-accent/8">
              <span className="text-xs font-semibold text-accent/50">
                {sortedBroadcasts.length} broadcast{sortedBroadcasts.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSortOrder(s => s === "Newest First" ? "Oldest First" : "Newest First")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-accent/50 hover:text-accent hover:bg-accent/8 transition-all"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortOrder}
              </button>
            </div>

            {/* Broadcast list — scrollable with styled scrollbar */}
            <div className="p-3 space-y-4 overflow-y-auto nice-scrollbar"
              style={{ maxHeight: "calc(100vh - 380px)", minHeight: "200px" }}>

              {/* Scheduled */}
              {scheduledBroadcasts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Scheduled</span>
                    <div className="flex-1 h-px bg-amber-200/50" />
                    <span className="text-[10px] text-amber-400 font-bold">{scheduledBroadcasts.length}</span>
                  </div>
                  {scheduledBroadcasts.map((broadcast) => (
                    <BroadcastCard
                      key={broadcast.id}
                      broadcast={broadcast}
                      isSelected={selectedBroadcast?.id === broadcast.id}
                      onClick={() => handleBroadcastSelect(broadcast)}
                    />
                  ))}
                </div>
              )}

              {/* Sent */}
              {sentBroadcasts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-accent/40 uppercase tracking-widest">Sent</span>
                    <div className="flex-1 h-px bg-accent/8" />
                    <span className="text-[10px] text-accent/30 font-bold">{sentBroadcasts.length}</span>
                  </div>
                  {sentBroadcasts.map((broadcast) => (
                    <BroadcastCard
                      key={broadcast.id}
                      broadcast={broadcast}
                      isSelected={selectedBroadcast?.id === broadcast.id}
                      onClick={() => handleBroadcastSelect(broadcast)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {sortedBroadcasts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  {searchQuery ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-accent/6 flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-accent/25" />
                      </div>
                      <p className="text-sm font-semibold text-accent/40">No results found</p>
                      <p className="text-xs text-accent/30 mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-3">
                        <Megaphone className="w-5 h-5 text-primary/50" />
                      </div>
                      <p className="text-sm font-semibold text-accent/40">No broadcasts yet</p>
                      <button
                        onClick={handleNewBroadCast}
                        className="mt-3 text-xs text-primary hover:text-primary/80 font-semibold"
                      >
                        Create your first →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Panel footer */}
            {broadcasts.length > 0 && (
              <div className="px-4 py-3 border-t border-accent/8 flex items-center gap-4 bg-accent/3">
                <span className="flex items-center gap-1.5 text-[11px] text-accent/40 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  {totalRecipients} recipients
                </span>
                <div className="w-px h-3.5 bg-accent/15" />
                <span className="flex items-center gap-1.5 text-[11px] text-accent/40 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {totalViews} views
                </span>
              </div>
            )}
          </div>

          {/* ══ Right detail panel ══ */}
          <div className="hidden lg:flex lg:col-span-8">
            <div className="w-full bg-tertiary rounded-3xl p-6 sm:p-8 min-h-150 flex flex-col">
              {newBroadCast ? (
                <NewBroadcast
                  onCancel={() => setNewBroadCast(false)}
                  onCreate={handleCreate}
                  creating={creating}
                />
              ) : selectedBroadcast ? (
                <BroadcastDetail
                  broadcast={selectedBroadcast}
                  onBack={handleBackToList}
                  onDeleted={() => handleBackToList()}
                  onUpdated={() => {}}
                />
              ) : (
                <EmptyBroadcastDetail onNew={handleNewBroadCast} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom sheet ── */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-tertiary rounded-t-3xl transition-transform duration-300 ease-out shadow-2xl h-[88vh] ${
          mobileDetailOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-accent/20 rounded-full" />
        </div>
        <div className="h-[calc(88vh-28px)] overflow-y-auto nice-scrollbar overscroll-contain px-4 pb-8">
          {newBroadCast ? (
            <NewBroadcast
              onCancel={() => { setNewBroadCast(false); setMobileDetailOpen(false); }}
              onCreate={handleCreate}
              creating={creating}
            />
          ) : (
            selectedBroadcast && (
              <BroadcastDetail
                broadcast={selectedBroadcast}
                onBack={() => setMobileDetailOpen(false)}
                onDeleted={() => { setMobileDetailOpen(false); setSelectedBroadcast(null); }}
                onUpdated={() => {}}
                isMobile={true}
              />
            )
          )}
        </div>
      </div>

      {mobileDetailOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setMobileDetailOpen(false)}
        />
      )}

      {selectedBroadcast && !mobileDetailOpen && (
        <button
          onClick={() => setMobileDetailOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-20 p-4 rounded-full bg-primary shadow-xl hover:bg-primary/90 transition-colors"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
