"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Eye, Search, Activity, Clock, CheckCircle } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import { StatusBadge,ActionButton } from "@/components/Dashboard/StatusBadge";
import { Input } from "@/components/ui/input";
import FilterButton from "@/components/Dashboard/FilterButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchContractorProjects,
  fetchUserProfile,
} from "@/lib/queries/projects";

const filters = [
  "All",
  "In Progress",
  "Review",
  "Completed",
  "Ready to Post",
  "Posted",
];

const filterToStatus = {
  "In Progress": "in_progress",
  Review: "review",
  Completed: "completed",
  "Ready to Post": "ready_to_post",
  Posted: "posted",
};

function computeStats(projects) {
  const total = projects.length;
  const active = projects.filter(
    (p) => p.status === "in_progress" || p.status === "review"
  ).length;
  const inReview = projects.filter((p) => p.status === "review").length;
  const completed = projects.filter(
    (p) => p.status === "completed" || p.status === "ready_to_post" || p.status === "posted"
  ).length;

  return [
    {
      icon: Activity,
      title: "Active Projects",
      percentage: total > 0 ? `${Math.round((active / total) * 100)}%` : "0%",
      subtitle: `${active} of ${total} assigned`,
    },
    {
      icon: Clock,
      title: "Videos in Review",
      percentage: total > 0 ? `${Math.round((inReview / total) * 100)}%` : "0%",
      subtitle: `${inReview} awaiting feedback`,
    },
    {
      icon: CheckCircle,
      title: "Completed",
      percentage: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
      subtitle: `${completed} delivered`,
    },
  ];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

const ContractorDashboard = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userProfile = await fetchUserProfile();
      if (!userProfile) return;
      setProfile(userProfile);
      const data = await fetchContractorProjects(userProfile.id);
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProjectView = (project) => {
    setLoading(true);
    router.push(`/dashboard/contractor/projects/${project.id}`);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "All" || project.status === filterToStatus[activeFilter];
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.platform || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = computeStats(projects);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div>
      {loading && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <Loader />
        </div>
      )}
      <div className="bg-secondary p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-accent mb-1 sm:mb-2">
                {getGreeting()}, {profile?.name?.split(" ")[0] || "there"}
              </h1>
              <p className="text-sm sm:text-base text-accent/70 font-onest font-bold">
                Your assigned projects and deadlines
              </p>
            </div>
            <div className="bg-white/50 py-2 px-4 rounded-full flex items-center gap-3 text-sm w-fit">
              <span className="text-accent/70 font-semibold">Status</span>
              <span className={`rounded-full py-1 px-3 font-bold text-xs ${
                profile?.onboarding_completed
                  ? "bg-green-100 text-green-700"
                  : "bg-white text-primary"
              }`}>
                {profile?.onboarding_completed ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold font-onest text-accent">
                Assigned Projects
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative w-full overflow-hidden">
                <div className="w-full">
                  <div className="lg:hidden w-full">
                    <Select value={activeFilter} onValueChange={setActiveFilter}>
                      <SelectTrigger className="h-11 w-full rounded-xl border border-accent/20 bg-white! text-sm font-semibold text-accent transition-all hover:border-primary/50 hover:bg-accent/5 focus:ring-2 focus:ring-primary/40 focus:border-primary">
                        <SelectValue placeholder="Select filter" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-accent/20 bg-white shadow-lg">
                        {filters.map((filter) => (
                          <SelectItem
                            key={filter}
                            value={filter}
                            className="cursor-pointer text-sm font-medium text-accent focus:bg-primary/10 focus:text-accent data-[state=checked]:bg-primary/15 data-[state=checked]:font-semibold"
                          >
                            {filter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden lg:flex gap-2 flex-wrap">
                    {filters.map((filter) => (
                      <FilterButton
                        key={filter}
                        active={activeFilter === filter}
                        onClick={() => setActiveFilter(filter)}
                      >
                        {filter}
                      </FilterButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative w-full lg:w-80 bg-white rounded-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white border-accent/10 text-accent placeholder:text-accent focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block bg-tertiary rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-accent/10">
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Project
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Client
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Status
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Deadline
                    </th>
                    <th className="text-right p-4 text-accent/70 font-semibold uppercase text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-accent/10 hover:bg-accent/5 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-accent">{project.title}</p>
                          <p className="text-xs text-accent/50 capitalize">{project.platform || "—"}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            {project.client?.avatar_url ? (
                              <AvatarImage src={project.client.avatar_url} />
                            ) : (
                              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                                {project.client?.name?.[0] || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="text-sm text-accent/80">
                            {project.client?.name || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={project.status} />
                      </td>

                      <td className="p-4 text-accent/70">
                        {formatDate(project.deadline)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            label="View"
                            onClick={() => handleProjectView(project)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-tertiary rounded-2xl p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-accent mb-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-accent/70 capitalize">
                        {project.platform || "—"}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-accent/60">
                    <span>Client: {project.client?.name || "—"}</span>
                    <span>Due: {formatDate(project.deadline)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <ActionButton
                      icon={Eye}
                      label="View"
                      onClick={() => handleProjectView(project)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && !isLoading && (
              <div className="bg-tertiary rounded-2xl p-12 text-center">
                <p className="text-accent/60">
                  {projects.length === 0
                    ? "No projects assigned yet."
                    : "No projects found matching your criteria."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
