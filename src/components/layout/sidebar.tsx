"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  User,
  LogOut,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { ThemeSettings } from "./theme-settings";

interface SidebarProps {
  type: "admin" | "org";
  orgSlug?: string;
}

export function Sidebar({ type, orgSlug }: SidebarProps) {
  const pathname = usePathname();
  const { orgName, orgLogoUrl } = useAuth();
  const { sidebarSize, setSidebarSize } = useTheme();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const collapsed = sidebarSize === "condensed";
  const isHidden = sidebarSize === "hidden";

  const adminRoutes = [
    { label: "Overview", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Organisations", icon: Building2, href: "/admin/organisations" },
    {
      label: "Illness Library",
      icon: Stethoscope,
      href: "/admin/illness-library",
    },
    { label: "Plans", icon: ClipboardList, href: "/admin/plans" },
    { label: "Commissions", icon: CreditCard, href: "/admin/commissions" },
    { label: "Platform Users", icon: Users, href: "/admin/users" },
    { label: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  const prefix = orgSlug ? `/${orgSlug}` : "/org";
  const orgRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: `${prefix}/dashboard` },
    { label: "Branding", icon: Settings, href: `${prefix}/branding` },
    { label: "Patient Roster", icon: User, href: `${prefix}/patients` },
    { label: "Illnesses", icon: Stethoscope, href: `${prefix}/illnesses` },
    { label: "Staff Management", icon: Users, href: `${prefix}/staff` },
    {
      label: "Medical Reports",
      icon: ClipboardList,
      href: `${prefix}/reports`,
    },
    { label: "Earnings", icon: BarChart3, href: `${prefix}/earnings` },
    { label: "Subscription", icon: CreditCard, href: `${prefix}/subscription` },
    { label: "Settings", icon: Settings, href: `${prefix}/settings` },
  ];

  const routes = type === "admin" ? adminRoutes : orgRoutes;

  /** Check if this route is the active page */
  const isActive = (href: string) => {
    if (type === "admin") return pathname === href;
    const segment = href.split("/").pop();
    return pathname.endsWith(`/${segment}`);
  };

  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const userInitials = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  if (isHidden) {
    return (
      <>
        <Button
          variant="default"
          size="icon"
          onClick={() => setSidebarSize("default")}
          className="fixed top-4 left-4 z-50 rounded-full shadow-lg"
        >
          <Menu size={20} />
        </Button>
        <ThemeSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col h-full border-r border-[#333333] bg-[#262626] text-sidebar-foreground transition-all duration-300 z-40",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex items-center justify-between h-20 px-4 border-b border-[#333333]">
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {type === "org" && orgLogoUrl ? (
                <div className="relative w-32 h-10">
                  <Image
                    src={orgLogoUrl}
                    alt={orgName || "Organisation Logo"}
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
              ) : (
                <div className="relative w-32 h-10">
                  <Image
                    src="/logo.png"
                    alt="H360 Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center w-full">
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#333333]">
                {type === "org" && orgLogoUrl ? (
                  <Image
                    src={orgLogoUrl}
                    alt={orgName || "Org Logo"}
                    fill
                    className="object-contain p-0.5"
                    priority
                    unoptimized
                  />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="H360 Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                )}
              </div>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setSidebarSize(collapsed ? "default" : "condensed")
              }
              className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            >
              <ChevronLeft size={18} />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {routes.map((route) => {
              const active = isActive(route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-[#4da63f] text-white shadow-lg shadow-[#4da63f]/20"
                      : "text-slate-400 hover:bg-[#333333] hover:text-white",
                  )}
                >
                  <route.icon
                    className={cn(
                      "w-5 h-5 shrink-0 transition-transform duration-200",
                      !collapsed && "mr-3",
                      active ? "scale-110" : "opacity-70",
                    )}
                  />
                  {!collapsed && <span>{route.label}</span>}
                </Link>
              );
            })}
          </div>
        </ScrollArea>

        {!collapsed && (
          <div className="px-4 py-2 border-t border-[#333333]">
            <div className="flex items-center justify-center gap-1.5">
              <div className="relative w-14 h-5 opacity-60">
                <Image
                  src="/logo.png"
                  alt="H360"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Powered by H360
              </span>
            </div>
          </div>
        )}
        <div className="p-4 space-y-2 border-t border-[#333333] bg-[#262626]">
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-sidebar-accent hover:text-white transition-all",
              collapsed && "justify-center px-0",
            )}
            onClick={() => setSettingsOpen(true)}
          >
            <Paintbrush className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Theme Settings</span>
            )}
          </Button>

          {!collapsed ? (
            <div className="flex items-center gap-3 w-full p-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-semibold shrink-0 ring-2 ring-sidebar-primary/20">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate text-white">
                  {user?.displayName || user?.email?.split("@")[0] || "Admin"}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {user?.email || "No email provided"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 shrink-0"
                onClick={() => auth.signOut()}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-semibold shrink-0 ring-2 ring-sidebar-primary/20">
                {userInitials}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                onClick={() => auth.signOut()}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ThemeSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
