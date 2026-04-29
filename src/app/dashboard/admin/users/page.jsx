"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchAllUsers } from "@/lib/queries/users";
import { Search, ShieldCheck, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/common/Loader";
import ChangeRoleModal from "@/components/users/changeRoleModal";

const FILTERS = ["All", "Client", "Contractor"];

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-red-500",
];

function roleColor(role) {
  if (role === "contractor") return "bg-blue-100 text-blue-700";
  if (role === "client") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-600";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleModalUser, setRoleModalUser] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredUsers = users.filter((user) => {
    const matchesFilter =
      activeFilter === "All" || user.role === activeFilter.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const roleCounts = {
    All: users.length,
    Client: users.filter((u) => u.role === "client").length,
    Contractor: users.filter((u) => u.role === "contractor").length,
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
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent mb-1">
            User Management
          </h1>
          <p className="text-sm text-accent/60">
            View all users and manage their roles
          </p>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-md"
                    : "bg-tertiary text-accent hover:bg-accent/5"
                }`}
              >
                {filter}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === filter
                      ? "bg-white/20 text-white"
                      : "bg-accent/10 text-accent/60"
                  }`}
                >
                  {roleCounts[filter]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80 bg-tertiary rounded-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-tertiary border-accent/10 text-accent placeholder:text-accent focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {filteredUsers.map((user, idx) => (
            <div key={user.id} className="bg-tertiary rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    className={`w-10 h-10 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                  >
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} />
                    ) : (
                      <AvatarFallback className="text-white text-sm font-bold">
                        {user.initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-accent text-sm">
                      {user.name}
                    </p>
                    <p className="text-xs text-accent/60">{user.email}</p>
                  </div>
                </div>
                <Badge
                  className={`${roleColor(user.role)} border-0 font-semibold text-xs capitalize`}
                >
                  {user.role}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-accent/60">
                <span>
                  {user.totalProjects} project
                  {user.totalProjects !== 1 ? "s" : ""} · {user.activeProjects}{" "}
                  active
                </span>
                <span>Since {formatDate(user.memberSince)}</span>
              </div>

              <button
                onClick={() => setRoleModalUser(user)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-accent/15 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
              >
                <UserCog className="w-4 h-4" />
                Change Role
              </button>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-tertiary rounded-2xl">
              <Search className="w-6 h-6 text-accent/50 mb-2" />
              <p className="text-accent/60 text-sm">No users found</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-tertiary rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-accent/10">
                <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                  User
                </th>
                <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                  Role
                </th>
                <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                  Projects
                </th>
                <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                  Member Since
                </th>
                <th className="text-left p-4 text-accent/70 font-semibold uppercase text-xs">
                  Role Change
                </th>
                <th className="text-right p-4 text-accent/70 font-semibold uppercase text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className="border-b border-accent/10 hover:bg-accent/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={`w-9 h-9 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                      >
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} />
                        ) : (
                          <AvatarFallback className="text-white text-xs font-bold">
                            {user.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-semibold text-accent text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-accent/50">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      className={`${roleColor(user.role)} border-0 font-semibold text-xs capitalize`}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-accent/70">
                    {user.totalProjects} total · {user.activeProjects} active
                  </td>
                  <td className="p-4 text-sm text-accent/70">
                    {formatDate(user.memberSince)}
                  </td>
                  <td className="p-4">
                    {user.canChangeRole ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Eligible
                      </span>
                    ) : (
                      <span className="text-xs text-accent/40">
                        Has associations
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setRoleModalUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-accent/60">
                No users found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change Role Modal */}
      {roleModalUser && (
        <ChangeRoleModal
          user={roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onSuccess={() => {
            setRoleModalUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}
