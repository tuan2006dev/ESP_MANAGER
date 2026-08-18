"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Trophy,
  UserCircle,
  DollarSign,
  Wallet,
  Gift,
  AlertTriangle,
  Bell,
  Activity,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Teams", href: "/admin/teams", icon: Users },
  { label: "Tasks", href: "/admin/tasks", icon: ClipboardList },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Ranking", href: "/admin/ranking", icon: Trophy },
  { label: "Members", href: "/admin/members", icon: UserCircle },
  { label: "Finance", href: "/admin/finance", icon: DollarSign },
  { label: "Salary", href: "/admin/salary", icon: Wallet },
  { label: "Bonus", href: "/admin/bonus", icon: Gift },
  { label: "Violations", href: "/admin/violations", icon: AlertTriangle },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
  { label: "IP Logs", href: "/admin/ip-logs", icon: Shield },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 glass px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold gradient-text">ESP Manager BTC</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-primary" />}
        </Button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile slide-over) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 z-40 border-r border-border/50 bg-sidebar transition-all duration-300 flex flex-col",
          // Mobile state
          mobileOpen ? "left-0 w-[280px]" : "-left-full md:left-0",
          // Desktop state
          collapsed ? "md:w-[68px]" : "md:w-[260px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-bold gradient-text">ESP Manager</span>
              <span className="text-[10px] text-muted-foreground">
                Esports Organization
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/15 text-primary glow-primary font-bold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active ? "text-primary" : ""
                    )}
                  />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 p-3">
          {(!collapsed || mobileOpen) && session?.user && (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {session.user.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xs font-semibold">
                  {session.user.name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground">
                  {session.user.role}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-muted-foreground hover:text-destructive text-xs"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {(!collapsed || mobileOpen) && "Đăng xuất"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 shrink-0 text-muted-foreground"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
