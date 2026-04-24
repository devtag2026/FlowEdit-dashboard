"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Lock } from "lucide-react";
import { Activity, Clock, CheckCircle } from "lucide-react";
import StatCard from "@/components/Dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { StatusBadge,ActionButton } from "@/components/Dashboard/StatusBadge";
import FilterButton from "@/components/Dashboard/FilterButton";
import NewProjectRequestModal from "@/components/Dashboard/NewProjectModal/NewProjectModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "@/components/common/Loader";
import { fetchClientProjects, fetchUserProfile } from "@/lib/queries/projects";

const filters = [
  "All",
  "Submitted",
  "In Progress",
  "Review",
  "Completed",
  "Ready to Post",
  "Posted",
];

const filterToStatus = {
  Submitted: "submitted",
  "In Progress": "in_progress",
  Review: "review",
  Completed: "completed",
  "Ready to Post": "ready_to_post",
  Posted: "posted",
};

function computeStats(projects) {
  const total = projects.length;
  const active = projects.filter(
    (p) => p.status === "submitted" || p.status === "in_progress" || p.status === "review"
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
      subtitle: `${active} of ${total} projects`,
    },
    {
      icon: Clock,
      title: "Videos in Review",
      percentage: total > 0 ? `${Math.round((inReview / total) * 100)}%` : "0%",
      subtitle: `${inReview} in review`,
    },
    {
      icon: CheckCircle,
      title: "Completed Projects",
      percentage: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
      subtitle: `${completed} of ${total} projects`,
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

const Dashboard = () => {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
      const data = await fetchClientProjects(userProfile.id);
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

  const handleOpenProject = (project) => {
    setLoading(true);
    router.push(`/dashboard/client/projects/${project.id}`);
  };

  const handleProjectCreated = () => {
    loadData();
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "All" || project.status === filterToStatus[activeFilter];
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.platform || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = computeStats(projects);

  const canSubmitProject = profile?.subscription_status === "active";

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
                Track your videos, revisions and progress
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {canSubmitProject ? (
                <Button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-auto bg-primary text-white px-7 sm:px-6 h-10 sm:h-11 rounded-xl text-sm sm:text-base font-semibold font-onest"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  New Project
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <Button
                    onClick={() => router.push("/dashboard/client/service")}
                    className="flex items-center justify-center gap-2 w-auto bg-amber-500 hover:bg-amber-600 text-white px-7 sm:px-6 h-10 sm:h-11 rounded-xl text-sm sm:text-base font-semibold font-onest"
                  >
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Upgrade Plan
                  </Button>
                  <p className="text-xs text-accent/60 text-right max-w-[220px]">
                    An active subscription is required to submit projects.
                  </p>
                </div>
              )}
            </div>
          </div>

          <NewProjectRequestModal
            isOpen={isProjectModalOpen}
            setIsOpen={setIsProjectModalOpen}
            clientId={profile?.id}
            onProjectCreated={handleProjectCreated}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-semibold font-onest text-accent">
                My Video Projects
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative w-full overflow-hidden">
                <div className="w-full">
                  <div className="lg:hidden w-full">
                    <Select
                      value={activeFilter}
                      onValueChange={setActiveFilter}
                    >
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
                      Project Name
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Platform
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Status
                    </th>
                    <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                      Last Updated
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
                        <p className="font-semibold text-accent">
                          {project.title}
                        </p>
                      </td>

                      <td className="p-4 text-accent/70 capitalize">
                        {project.platform || "—"}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={project.status} />
                      </td>

                      <td className="p-4 text-accent/70">
                        {formatDate(project.updated_at)}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            label="View"
                            onClick={() => handleOpenProject(project)}
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

                  <p className="text-xs text-accent/60">
                    Last updated: {formatDate(project.updated_at)}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <ActionButton
                      icon={Eye}
                      label="View"
                      onClick={() => handleOpenProject(project)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {filteredProjects.length === 0 && !isLoading && (
              <div className="bg-tertiary rounded-2xl p-12 text-center">
                <p className="text-accent/60">
                  {projects.length === 0
                    ? canSubmitProject
                      ? "No projects yet. Click \"New Project\" to get started."
                      : "No projects yet. Upgrade your plan to submit your first project."
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

export default Dashboard;
