"use client";
import { useState } from "react";
import EmptyBroadcastDetail from "@/components/broadcasts/EmptyBroadcast";
import BroadcastDetail from "@/components/broadcasts/BroadcastsDetail";
import { createBroadcast } from "@/lib/queries/broadcast";
import { useBroadcasts } from "@/hooks/admin/useBroadcast";
import { Plus, Search, Eye, ChevronUp, Megaphone, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NewBroadcast from "@/components/broadcasts/NewBroadcast";
import Loader from "@/components/common/Loader";
import { filters, AUDIENCE_COLORS } from "@/constants/admin/broadcast";

export default function BroadcastsPage() {
  const { broadcasts, loading } = useBroadcasts();

  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("Newest First");
  const [newBroadCast, setNewBroadCast] = useState(false);

  const filteredBroadcasts = broadcasts.filter((broadcast) => {
    const matchesFilter =
      activeFilter === "All" || activeFilter === broadcast.audience;
    const matchesSearch =
      broadcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      broadcast.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const scheduledBroadcasts = filteredBroadcasts.filter(
    (b) => b.status === "scheduled",
  );
  const sentBroadcasts = filteredBroadcasts.filter((b) => b.status === "sent");

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

  const handleCreate = async ({ title, message, audience }) => {
    try {
      setCreating(true);
      await createBroadcast({ title, message, audience });
      setNewBroadCast(false);
      setMobileDetailOpen(false);
    } catch (err) {
      console.error("Failed to create broadcast:", err);
      alert("Failed to send broadcast. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const totalViews = broadcasts.reduce((sum, b) => sum + (b.views ?? 0), 0);
  const readRate =
    broadcasts.length > 0
      ? Math.round(
          (broadcasts.filter((b) => (b.views ?? 0) > 0).length /
            broadcasts.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-accent">
            Broadcasts
          </h1>
          <p className="text-sm text-accent/60 mt-1">
            Send announcements and updates to your users
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-tertiary rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Total Broadcasts</p>
              <p className="text-2xl font-bold text-accent">{broadcasts.length}</p>
            </div>
          </div>
          <div className="bg-tertiary rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Total Views</p>
              <p className="text-2xl font-bold text-accent">{totalViews}</p>
            </div>
          </div>
          <div className="bg-tertiary rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-accent/60 font-medium uppercase">Engagement Rate</p>
              <p className="text-2xl font-bold text-accent">{readRate}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left panel ── */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-tertiary rounded-3xl p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between flex-col sm:flex-row gap-2">
                <h2 className="text-xl font-bold text-accent">Broadcasts</h2>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl w-full sm:w-fit"
                  onClick={handleNewBroadCast}
                >
                  <Plus className="w-4 h-4" />
                  New Broadcast
                </Button>
              </div>

              {/* Scheduled */}
              <div>
                <h3 className="text-xs font-semibold text-accent/60 uppercase mb-3">
                  Scheduled
                </h3>
                <div className="space-y-3">
                  {scheduledBroadcasts.length > 0 ? (
                    scheduledBroadcasts.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        onClick={() => handleBroadcastSelect(broadcast)}
                        className={`bg-secondary rounded-2xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md min-w-0 ${
                          selectedBroadcast?.id === broadcast.id
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                      >
                        {/* Title — truncated with tooltip on hover */}
                        <h4
                          className="font-semibold text-accent mb-2 truncate text-sm sm:text-base"
                          title={broadcast.title}
                        >
                          {broadcast.title}
                        </h4>
                        {/* Badges wrap instead of overflow */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge
                            className={`${broadcast.audienceColor} border-0 text-xs shrink-0`}
                          >
                            {broadcast.audience}
                          </Badge>
                          <Badge
                            className={`${broadcast.priorityColor} border-0 text-xs shrink-0`}
                          >
                            {broadcast.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-accent/60 truncate">
                          {broadcast.scheduledFor}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-accent/40 text-center py-4">
                      No scheduled broadcasts
                    </p>
                  )}
                </div>
              </div>

              {/* Sent */}
              <div>
                <h3 className="text-xs font-semibold text-accent/60 uppercase mb-3">
                  Sent ({sentBroadcasts.length})
                </h3>
                <div className="space-y-3">
                  {sentBroadcasts.length > 0 ? (
                    sentBroadcasts.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        onClick={() => handleBroadcastSelect(broadcast)}
                        className={`bg-secondary rounded-2xl p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md min-w-0 border border-transparent ${
                          selectedBroadcast?.id === broadcast.id
                            ? "ring-2 ring-primary border-primary/20"
                            : "hover:border-accent/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4
                            className="font-semibold text-accent truncate text-sm sm:text-base flex-1"
                            title={broadcast.title}
                          >
                            {broadcast.title}
                          </h4>
                          <span className="text-xs text-accent/50 shrink-0 pt-0.5">
                            {broadcast.sentAt}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge
                            className={`${broadcast.audienceColor} border-0 text-xs shrink-0`}
                          >
                            {broadcast.audience}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-accent/60">
                          <Eye className="w-3 h-3" />
                          <span>{broadcast.views} seen</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Megaphone className="w-6 h-6 text-accent/20 mb-2" />
                      <p className="text-sm text-accent/40">No sent broadcasts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Desktop right panel ── */}
          <div className="hidden lg:block lg:col-span-8">
            <div className="bg-tertiary rounded-3xl p-6 min-h-150">
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
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />
              ) : (
                <EmptyBroadcastDetail />
              )}
            </div>
          </div>

          {/* ── Mobile list ── */}
          <div className="lg:hidden space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter
                      ? "bg-primary text-white shadow-md"
                      : "bg-tertiary text-accent hover:bg-accent/5"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative bg-tertiary rounded-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
              <Input
                type="text"
                placeholder="Search broadcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-tertiary border-accent/10 text-accent placeholder:text-accent/50 focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-3">
              {filteredBroadcasts.map((broadcast) => (
                <div
                  key={broadcast.id}
                  onClick={() => handleBroadcastSelect(broadcast)}
                  className="bg-tertiary rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow min-w-0"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {/* title truncates — badge stays on same line with shrink-0 */}
                    <h3
                      className="font-semibold text-accent flex-1 truncate text-sm"
                      title={broadcast.title}
                    >
                      {broadcast.title}
                    </h3>
                    <Badge
                      className={`${broadcast.priorityColor} border-0 text-xs ml-2 shrink-0`}
                    >
                      {broadcast.priority}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <Badge
                      className={`${broadcast.audienceColor} border-0 text-xs shrink-0`}
                    >
                      {broadcast.audience}
                    </Badge>
                    {broadcast.status === "scheduled" ? (
                      <span className="text-xs text-accent/60 truncate">
                        {broadcast.scheduledFor}
                      </span>
                    ) : (
                      <span className="text-xs text-accent/60 flex items-center gap-1 shrink-0">
                        <Eye className="w-3 h-3" />
                        {broadcast.views} seen • Sent {broadcast.sentAt}
                      </span>
                    )}
                  </div>

                  {/* Preview — 2 line clamp prevents card height explosion */}
                  <p className="text-sm text-accent/70 line-clamp-2 break-words">
                    {broadcast.content?.replace(/<[^>]*>/g, "") || ""}
                  </p>
                </div>
              ))}

              {filteredBroadcasts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-tertiary rounded-2xl">
                  <Search className="w-6 h-6 text-accent/50 mb-2" />
                  <p className="text-accent/60 text-sm">No broadcasts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile detail sheet ── */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-tertiary border-accent/10 rounded-t-3xl transition-transform duration-300 ease-out shadow-2xl h-[85vh] ${
          mobileDetailOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="h-[calc(85vh-24px)] overflow-y-auto overscroll-contain px-4 pb-6">
          {newBroadCast ? (
            <NewBroadcast
              onCancel={() => {
                setNewBroadCast(false);
                setMobileDetailOpen(false);
              }}
              onCreate={handleCreate}
              creating={creating}
            />
          ) : (
            selectedBroadcast && (
              <BroadcastDetail
                broadcast={selectedBroadcast}
                onBack={() => setMobileDetailOpen(false)}
                onDeleted={() => {
                  setMobileDetailOpen(false);
                  setSelectedBroadcast(null);
                }}
                onUpdated={() => {}}
                isMobile={true}
              />
            )
          )}
        </div>
      </div>

      {mobileDetailOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileDetailOpen(false)}
        />
      )}

      {selectedBroadcast && !mobileDetailOpen && (
        <button
          onClick={() => setMobileDetailOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-20 p-4 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
