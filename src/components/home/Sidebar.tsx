"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  Briefcase,
  CalendarClock,
  GraduationCap,
  Users,
  Landmark,
  IndianRupee,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import type { Partner } from "@/lib/api/types";
import { useUnreadNotificationCount } from "@/hooks/queries/useNotifications";
import PartnerAvatar from "./PartnerAvatar";

export type SidebarView =
  | "home"
  | "bookings"
  | "availability"
  | "team"
  | "memberships"
  | "bank"
  | "training"
  | "notifications"
  | "money"
  | "profile"
  // Not a nav item (no Sidebar entry routes here) — included only so
  // PartnerHomescreen can pass its subView straight through as activeView
  // without every item lighting up unmatched.
  | "tracking";

interface SidebarProps {
  partner: Partner;
  activeView: SidebarView;
  isApproved: boolean;
  // Drives the Notifications item's active state — that drawer isn't a
  // subView (see PartnerHomescreen's SubView type), so activeView alone
  // never equals "notifications"; this is how the item still lights up
  // while it's open.
  notificationsOpen?: boolean;
  // Mandatory-training gate mode (see TrainingGateScreen) — the nav list
  // collapses to just "Training", every other destination is unreachable
  // until training is done rather than merely locked-looking.
  trainingOnly?: boolean;
  onNavigateTab: (tab: "home" | "money" | "profile") => void;
  onOpenSubView: (
    view: "bookings" | "availability" | "team" | "memberships" | "bank" | "training"
  ) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

interface NavItem {
  key: SidebarView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
  badge?: number;
  go: () => void;
}

const STORAGE_KEY = "eezit-partner-sidebar-collapsed";

/**
 * Desktop-only persistent left nav — mirrors the admin panel's sidebar
 * pattern (collapsible icon rail, active-state list, user footer card) but
 * reskinned to this app's light cream/gold palette rather than the admin's
 * dark theme, to stay consistent with the rest of the partner-facing UI.
 * Replaces the old top DesktopNav (3 tabs only) with a single nav that also
 * covers the "Manage your work" destinations (Bookings, Availability &
 * slots, Team, Bank account), so those are reachable without going back to
 * Home first. Mobile keeps the existing BottomNav + on-page manage cards
 * instead of a drawer version of this, so there's one mobile nav pattern.
 */
export default function Sidebar({
  partner,
  activeView,
  isApproved,
  notificationsOpen = false,
  trainingOnly = false,
  onNavigateTab,
  onOpenSubView,
  onOpenNotifications,
  onLogout,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  // See PartnerStatusHeader's identical bell — bumped on every click and
  // used as the notifications icon's `key` below so the bell-bounce
  // keyframe (globals.css) restarts clean even on a rapid second click.
  const [bellBounceKey, setBellBounceKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a one-time persisted preference on mount, not a render-loop hazard
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  // Training-only mode collapses the whole nav to a single marker — every
  // other destination is genuinely unreachable while mandatory training is
  // incomplete, not just shown locked (see TrainingGateScreen).
  const items: NavItem[] = trainingOnly
    ? [{ key: "training", label: "Training", icon: GraduationCap, go: () => {} }]
    : [
        { key: "home", label: "Home", icon: Home, go: () => onNavigateTab("home") },
        { key: "bookings", label: "Bookings", icon: Briefcase, locked: !isApproved, go: () => onOpenSubView("bookings") },
        {
          key: "availability",
          label: "Availability & slots",
          icon: CalendarClock,
          locked: !isApproved,
          go: () => onOpenSubView("availability"),
        },
        ...(partner.type === "BUSINESS"
          ? [
              {
                key: "team" as const,
                label: "Team",
                icon: Users,
                // Unlocked as soon as the business's own KYC is approved, so
                // the owner can add employees + submit their KYC while the
                // final partner review is still running.
                locked: !isApproved && partner.kyc?.status !== "APPROVED",
                go: () => onOpenSubView("team"),
              },
            ]
          : [
              {
                // Individual partners can be on a business's team — never
                // locked, an invite may land before full approval.
                key: "memberships" as const,
                label: "Memberships",
                icon: Users,
                go: () => onOpenSubView("memberships"),
              },
            ]),
        { key: "bank", label: "Bank account", icon: Landmark, locked: !isApproved, go: () => onOpenSubView("bank") },
        // Never locked — by the time the normal sidebar is showing at all
        // (PENDING_APPROVAL/APPROVED), mandatory training is already done,
        // so this is purely for rewatching.
        { key: "training", label: "Training", icon: GraduationCap, go: () => onOpenSubView("training") },
        // Never locked — KYC/training/approval updates all arrive as pushes
        // before a partner is APPROVED, so this has to stay reachable throughout.
        {
          key: "notifications",
          label: "Notifications",
          icon: Bell,
          badge: unreadCount,
          go: () => {
            setBellBounceKey((k) => k + 1);
            onOpenNotifications();
          },
        },
        { key: "money", label: "Money", icon: IndianRupee, go: () => onNavigateTab("money") },
        // Profile lives in Topbar's account menu (top-right, desktop-only)
        // instead of here now — that menu is reachable from every view,
        // not just while this nav list is on screen.
      ];

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-stone-100 lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo + collapse toggle */}
      <div
        className={`flex items-center border-b border-stone-100 ${
          collapsed ? "justify-center px-2 py-5" : "justify-between px-5 py-5"
        }`}
      >
        <div className={`flex items-center min-w-0 ${collapsed ? "" : "gap-2.5"}`}>
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#C9851A] to-[#FFD580] flex items-center justify-center shadow-sm shrink-0">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z" fill="white" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-extrabold text-stone-900 tracking-wide text-sm truncate">EEZIT PARTNER</span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Minimize sidebar"
            className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          title="Expand sidebar"
          className="mx-auto mt-2 p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = item.key === "notifications" ? notificationsOpen : activeView === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.locked ? undefined : item.go}
              aria-disabled={item.locked}
              title={collapsed ? `${item.label}${item.locked ? " (unlocks once approved)" : ""}` : undefined}
              className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                item.key === "notifications" ? "active:scale-[0.97]" : ""
              } ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
              } ${
                item.locked
                  ? "opacity-50 cursor-not-allowed text-stone-400"
                  : isActive
                  ? "bg-[#FDF3E7] text-[#C9851A]"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              }`}
            >
              <span className="relative shrink-0">
                <Icon
                  key={item.key === "notifications" ? bellBounceKey : undefined}
                  className={`w-4.5 h-4.5 ${item.key === "notifications" ? "animate-bell-bounce" : ""}`}
                />
                {!!item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#C9851A] text-[8px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!collapsed && item.locked && <Lock className="w-3.5 h-3.5 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-stone-100 p-3 space-y-2 ${collapsed ? "px-2" : ""}`}>
        <div
          title={collapsed ? (partner.name ?? undefined) : undefined}
          className={`flex items-center rounded-xl bg-[#FAF9F6] border border-stone-100 ${
            collapsed ? "justify-center py-2" : "gap-2.5 px-3 py-2"
          }`}
        >
          <PartnerAvatar
            partner={partner}
            className="w-8 h-8 bg-[#FDF3E7] text-[#C9851A] text-xs shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-800 truncate">{partner.name ?? "Partner"}</p>
              <p className="text-[10px] text-stone-400 truncate">{partner.city ?? partner.type}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-bold text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer ${
            collapsed ? "justify-center py-2.5" : "gap-2.5 px-3.5 py-2.5"
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
