"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import type { Partner } from "@/lib/api/types";
import { useUnreadNotificationCount } from "@/hooks/queries/useNotifications";
import PartnerAvatar from "./PartnerAvatar";

/**
 * Desktop-only topbar for the main content column, to the right of
 * Sidebar — unlike PartnerStatusHeader (which only renders on the Home
 * tab), this is persistent across every view (Home, Money, Bookings,
 * Availability, ...). Houses the notifications bell and the account menu
 * (Profile / Settings) — the account menu used to be a "Profile" entry in
 * Sidebar's nav list; moved here so it stays reachable no matter which
 * subview is open, and so it reads as an account menu rather than a nav
 * destination.
 *
 * The bell mirrors PartnerStatusHeader's / Sidebar's — same drawer, same
 * unread badge — but stays on screen for every desktop view, not just Home.
 * PartnerStatusHeader's own bell is hidden on lg for that reason, so the two
 * never show at once.
 *
 * Settings has no dedicated screen yet — it opens the same account page as
 * Profile (personal info/banking/location) rather than a placeholder.
 */
export default function Topbar({
  partner,
  onNavigateTab,
  onOpenNotifications,
  onLogout,
}: {
  partner: Partner;
  onNavigateTab: (tab: "home" | "money" | "profile") => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;
  // Bumped on every click, then used as the Bell icon's `key` so the
  // bell-bounce keyframe (globals.css) restarts clean even on a rapid second
  // click mid-bounce — same trick as PartnerStatusHeader / Sidebar.
  const [bounceKey, setBounceKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const goToProfile = () => {
    setOpen(false);
    onNavigateTab("profile");
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <header className="hidden lg:flex items-center justify-end gap-2 shrink-0 h-16 px-6 border-b border-stone-100 bg-white sticky top-0 z-20">
      <button
        onClick={() => {
          setBounceKey((k) => k + 1);
          onOpenNotifications();
        }}
        className="relative w-9 h-9 rounded-xl border border-stone-100 bg-white flex items-center justify-center cursor-pointer hover:bg-stone-50 active:scale-90 transition-all"
        aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell key={bounceKey} className="w-4 h-4 text-stone-600 animate-bell-bounce" strokeWidth={1.8} />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9851A] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex items-center gap-2.5 rounded-xl pl-1.5 pr-2.5 py-1.5 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <PartnerAvatar
            partner={partner}
            className="w-8 h-8 bg-[#FDF3E7] text-[#C9851A] text-xs shrink-0"
          />
          <span className="text-xs font-bold text-stone-700 max-w-40 truncate">
            {partner.name ?? "Partner"}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-stone-100 bg-white shadow-lg py-1.5 z-30">
            <button
              onClick={goToProfile}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={goToProfile}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <div className="my-1 h-px bg-stone-100" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
