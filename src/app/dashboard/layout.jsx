"use client";
import { getUnreadCount } from "@/lib/queries/notifications";

import {
  Bell,
  BriefcaseBusiness,
  DollarSign,
  FileText,
  FolderOpen,
  House,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  PencilRuler,
  RadioIcon,
  Share2,
  Users,
  UserCog,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient, getUser } from "../../lib/supabase/client";
const supabase = getSupabaseClient()

const navigationConfig = {
  client: [
    { name: "Dashboard", href: "/dashboard/client", icon: LayoutDashboard },
    { name: "Notification", href: "/dashboard/client/notification", icon: Bell },
    { name: "Branding", href: "/dashboard/client/branding", icon: PencilRuler },
    { name: "Social", href: "/dashboard/client/social", icon: Share2 },
    { name: "Service", href: "/dashboard/client/service", icon: BriefcaseBusiness },
  ],
  admin: [
    { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Notifications", href: "/dashboard/admin/notification", icon: Bell },
    { name: "Broadcasts", href: "/dashboard/admin/broadcasts", icon: RadioIcon },
    { name: "Users", href: "/dashboard/admin/users", icon: UserCog },
    { name: "Payouts", href: "/dashboard/admin/contractors", icon: DollarSign },
    { name: "Contracts", href: "/dashboard/admin/contracts", icon: FileText },
    // { name: "Clients", href: "/dashboard/admin/clients", icon: Users },
  ],
  contractor: [
    { name: "Dashboard", href: "/dashboard/contractor", icon: House },
    { name: "Earnings", href: "/dashboard/contractor/earnings", icon: DollarSign },
    { name: "Contracts", href: "/dashboard/contractor/contracts", icon: FileText },
    // { name: "Resources", href: "/dashboard/contractor/resources", icon: FolderOpen },
    { name: "Notifications", href: "/dashboard/contractor/notification", icon: Bell },
  ],
};

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  const role = pathname.split("/")[2]; // "client" | "admin" | "contractor"
  const navigation = navigationConfig[role] || navigationConfig.client;

  // Fetch profile once on mount + subscribe to realtime notifications
  useEffect(() => {
    let channel;
    const init = async () => {
      const {
        data: { user },
      } = await getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();
        setUserProfile(profile);
        getUnreadCount(user.id)
          .then(setUnreadCount)
          .catch(() => setUnreadCount(0));

        // Subscribe to new notifications for this user (user-scoped name prevents cross-session leaks)
        channel = supabase
          .channel(`notifications-bell-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Re-fetch count when notifications are marked as read
              getUnreadCount(user.id)
                .then(setUnreadCount)
                .catch(() => setUnreadCount(0));
            }
          )
          .subscribe();
      }
    };
    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href) => {
    if (href === `/dashboard/${role}`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const onLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary text-white">
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-72`}
      >
        <div className="h-full flex flex-col bg-linear-to-b bg-primary backdrop-blur-xl">
          <div className="flex items-center justify-between px-20 pt-8 pb-6">
            <Link
              href={`/dashboard/${role}`}
              className="flex items-center gap-3 group"
            >
              <span className="text-3xl font-extrabold font-onest">
                FlowEdit
              </span>
            </Link>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 relative left-12 bottom-8 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-5 py-2 rounded-xl transition-all duration-300 group
    ${
      active
        ? `
          bg-linear-to-tr from-purple-500/70 to-secondary/50
          text-white
          shadow-lg shadow-primary/25
        `
        : `
          text-accent
          hover:bg-white/30
          hover:shadow-md hover:shadow-purple-500/10
          active:bg-white/10
        `
    }
  `}
                  aria-current={active ? "page" : undefined}
                >
                  <div
                    className={`group flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-tertiary" : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        active
                          ? "text-accent"
                          : "text-white/70 group-hover:text-tertiary/80"
                      }`}
                    />
                  </div>

                  <span
                    className={`font-medium ${
                      active ? "text-white" : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Notification badge */}
                  {item.name.toLowerCase().includes("notification") &&
                    unreadCount > 0 && (
                      <span
                        className={`ml-auto flex items-center justify-center text-[10px] ${
                          unreadCount > 9
                            ? "min-w-5 h-5 "
                            : "min-w-4.5 h-4.5"
                        } font-bold text-white bg-red-500 rounded-full`}
                      >
                        {unreadCount}
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={onLogout}
              disabled={isLoading}
              className="flex items-center gap-3 px-5 py-2 w-full rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isLoading ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-72">
        <header
          className={`sticky top-0 z-20 transition-all duration-300 ${
            isScrolled
              ? "shadow-lg bg-secondary/95"
              : "shadow-none bg-secondary/90"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-900 border border-tertiary rounded-full transition-colors active:bg-gray-800"
                aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
              >
                <Menu className="w-5 h-5 text-accent" />
              </button>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <Link href={`/dashboard/${role}/notification`}>
                <button
                  className="relative sm:flex bg-tertiary p-2.5 lg:p-3 rounded-full hover:bg-purple-500/20 transition-colors active:scale-95 cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="text-accent w-4 h-4 lg:w-5 lg:h-5" />

                  {unreadCount > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 flex items-center justify-center text-[10px] ${
                        unreadCount > 9
                          ? "min-w-5 h-5 "
                          : "min-w-4.5 h-4.5"
                      } font-bold text-white bg-red-500 rounded-full`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </Link>

              <Link href={`/dashboard/${role}/profile`}>
                <div className="relative flex items-center gap-2 px-1 py-1 lg:px-3 lg:py-2 rounded-full lg:rounded-full bg-tertiary hover:border-purple-400/70 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.7)] transition-all duration-300 active:scale-95">
                  <div className="relative w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden bg-linear-to-br from-purple-600 to-purple-400 shrink-0">
                    {userProfile?.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>

                  <span className="hidden lg:block text-sm lg:text-base font-semibold text-accent">
                    {userProfile?.name || "User"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      </div>
    </div>
  );
}
