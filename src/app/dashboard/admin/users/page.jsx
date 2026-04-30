"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchAllUsers } from "@/lib/queries/users";
import { updateClientSocialAccess } from "@/lib/queries/socials";
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

const SOCIAL_PLATFORMS = [
  {
    key: "youtube",
    label: "YouTube",
    enabledClass: "text-[#ff0000]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    enabledClass: "text-pink-500",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    enabledClass: "text-[#1877f2]",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    enabledClass: "text-black",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
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

function SocialToggles({ user, onToggle, saving }) {
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_PLATFORMS.map((p) => {
        const enabled = !!user.socialAccess?.[p.key];
        return (
          <button
            key={p.key}
            type="button"
            title={`${enabled ? "Disable" : "Enable"} ${p.label}`}
            disabled={saving}
            onClick={() => onToggle(user, p.key)}
            className={`w-6 h-6 flex items-center justify-center rounded transition-opacity ${
              saving ? "opacity-40 cursor-not-allowed" : "hover:opacity-70 cursor-pointer"
            } ${enabled ? p.enabledClass : "text-accent/20"}`}
          >
            <p.icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [savingAccess, setSavingAccess] = useState({});

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

  const handleTogglePlatform = async (user, platform) => {
    const current = user.socialAccess || {};
    const newAccess = { ...current, [platform]: !current[platform] };

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, socialAccess: newAccess } : u
      )
    );

    setSavingAccess((prev) => ({ ...prev, [user.id]: true }));
    try {
      await updateClientSocialAccess(user.id, newAccess);
    } catch (err) {
      console.error("Failed to update social access:", err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, socialAccess: current } : u
        )
      );
    } finally {
      setSavingAccess((prev) => ({ ...prev, [user.id]: false }));
    }
  };

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

              {user.role === "client" && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-accent/50 shrink-0">Social access:</span>
                  <SocialToggles
                    user={user}
                    onToggle={handleTogglePlatform}
                    saving={!!savingAccess[user.id]}
                  />
                </div>
              )}
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
                  Social Access
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
                  <td className="p-4">
                    {user.role === "client" ? (
                      <SocialToggles
                        user={user}
                        onToggle={handleTogglePlatform}
                        saving={!!savingAccess[user.id]}
                      />
                    ) : (
                      <span className="text-accent/30 text-sm">—</span>
                    )}
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
