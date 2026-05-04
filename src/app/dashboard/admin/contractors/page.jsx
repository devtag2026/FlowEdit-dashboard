"use client";
import { useState, useEffect, useCallback } from "react";
import EmptyContractorDetail from "@/components/contractors/EmptyContractor";
import ContractorDetail from "@/components/contractors/ContractorDetail";
import { fetchContractors } from "@/lib/queries/contractors";
import {
  Search,
  Eye,
  MessageSquare,
  MoreVertical,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/Dashboard/StatusBadge";
import Loader from "@/components/common/Loader";

const filters = ["All", "New", "Inactive"];

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function statusColor(status) {
  if (status === "Active") return "bg-green-100 text-green-700";
  if (status === "New") return "bg-blue-100 text-blue-700";
  if (status === "Inactive") return "bg-gray-100 text-gray-700";
  return "bg-yellow-100 text-yellow-700";
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContractors();
      setContractors(
        data.map((c, i) => ({
          ...c,
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
          statusColor: statusColor(c.status),
        }))
      );
    } catch (err) {
      console.error("Failed to load contractors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredContractors = contractors.filter((contractor) => {
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "New" && contractor.status === "New") ||
      (activeFilter === "Inactive" && contractor.status === "Inactive");
    const matchesSearch =
      contractor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleContractorSelect = (contractor) => {
    setSelectedContractor(contractor);
    setMobileDetailOpen(true);
  };

  const handleBackToList = () => {
    setSelectedContractor(null);
    setMobileDetailOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent mb-1">
            Payouts
          </h1>
          <p className="text-sm text-accent/60">
            View contractors and manage payments
          </p>
        </div>

        {/* Desktop detail panel */}
        <div className="hidden lg:block">
          {selectedContractor ? (
            <ContractorDetail
              contractor={selectedContractor}
              onBack={handleBackToList}
            />
          ) : (
            <EmptyContractorDetail />
          )}
        </div>

        <div className="space-y-4">
          {/* Filters + Search */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFilter === filter
                      ? "bg-primary text-white shadow-md"
                      : "bg-tertiary text-accent hover:bg-accent/5"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-80 bg-tertiary rounded-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
              <Input
                type="text"
                placeholder="Search Contractors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-tertiary border-accent/10 text-accent placeholder:text-accent focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-4">
            {filteredContractors.map((contractor) => (
              <div
                key={contractor.id}
                onClick={() => handleContractorSelect(contractor)}
                className="bg-tertiary rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className={`w-12 h-12 ${contractor.avatarColor}`}>
                      {contractor.avatar_url ? (
                        <img
                          src={contractor.avatar_url}
                          alt={contractor.name}
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="text-white font-bold">
                          {contractor.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold text-accent">
                        {contractor.name}
                      </p>
                      <p className="text-sm text-accent/60">
                        {contractor.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`${contractor.statusColor} border-0 font-semibold`}
                  >
                    {contractor.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-accent/60 mb-1">Status</p>
                    <p className="text-sm font-medium text-accent">
                      {contractor.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-accent/60 mb-1">
                      Active Projects
                    </p>
                    <p className="text-sm font-medium text-accent">
                      {contractor.activeProjects}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-accent/60 mb-1">Last Activity</p>
                    <p className="text-sm font-medium text-accent">
                      {contractor.lastActivity}
                    </p>
                  </div>
                </div>

                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleContractorSelect(contractor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-tertiary rounded-lg text-accent hover:bg-accent/5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">View</span>
                  </button>

                </div>
              </div>
            ))}

            {filteredContractors.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-tertiary rounded-2xl">
                <Search className="w-6 h-6 text-accent/50 mb-2" />
                <p className="text-accent/60 text-sm">No contractors found</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-tertiary rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/10">
                  <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                    Contractor
                  </th>
                  <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                    Status
                  </th>
                  <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                    Active Projects
                  </th>
                  <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                    Last Activity
                  </th>
                  <th className="text-right p-4 text-accent/70 font-semibold uppercase text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContractors.map((contractor) => (
                  <tr
                    key={contractor.id}
                    onClick={() => handleContractorSelect(contractor)}
                    className={`border-b border-accent/10 hover:bg-accent/5 transition-colors cursor-pointer ${
                      selectedContractor?.id === contractor.id
                        ? "bg-accent/5"
                        : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className={`w-10 h-10 ${contractor.avatarColor}`}
                        >
                          {contractor.avatar_url ? (
                            <img
                              src={contractor.avatar_url}
                              alt={contractor.name}
                              className="object-cover w-full h-full rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="text-white font-bold">
                              {contractor.initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-accent">
                            {contractor.name}
                          </p>
                          <p className="text-xs text-accent/60">
                            {contractor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`${contractor.statusColor} border-0 font-semibold`}
                      >
                        {contractor.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-accent/70">
                      {contractor.activeProjects}
                    </td>
                    <td className="p-4 text-accent/70">
                      {contractor.lastActivity}
                    </td>
                    <td className="p-4">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionButton
                          icon={Eye}
                          label="View"
                          onClick={() => handleContractorSelect(contractor)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredContractors.length === 0 && (
            <div className="hidden lg:block bg-tertiary rounded-2xl p-12 text-center">
              <p className="text-accent/60">
                No contractors found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail sheet */}
      <div
        className={`
          lg:hidden fixed inset-x-0 bottom-0 z-40 bg-tertiary border-t border-gray-200 rounded-t-3xl
          transition-transform duration-300 ease-out shadow-2xl
          ${mobileDetailOpen ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ maxHeight: "80vh" }}
      >
        <div className="h-full overflow-y-auto">
          {selectedContractor && (
            <ContractorDetail
              contractor={selectedContractor}
              onBack={() => setMobileDetailOpen(false)}
              isMobile={true}
            />
          )}
        </div>
      </div>

      {mobileDetailOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileDetailOpen(false)}
        />
      )}

      {selectedContractor && !mobileDetailOpen && (
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
