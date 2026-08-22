"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Settings, User } from "lucide-react";
import type { Partner } from "@/lib/api/types";
import PartnerAvatar from "./PartnerAvatar";

/**
 * Desktop-only topbar for the main content column, to the right of
 * Sidebar — unlike PartnerStatusHeader (which only renders on the Home
 * tab), this is persistent across every view (Home, Money, Bookings,
 * Availability, ...). Houses the account menu (Profile / Settings) that
 * used to be a "Profile" entry in Sidebar's nav list; moved here so it
 * stays reachable no matter which subview is open, and so it reads as an
 * account menu rather than a nav destination.
 *
 * Settings has no dedicated screen yet — it opens the same account page as
 * Profile (personal info/banking/location) rather than a placeholder.
 */
export default function Topbar({
  partner,
  onNavigateTab,
}: {
  partner: Partner;
  onNavigateTab: (tab: "home" | "money" | "profile") => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="hidden lg:flex items-center justify-end shrink-0 h-16 px-6 border-b border-stone-100 bg-white sticky top-0 z-20">
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
          </div>
        )}
      </div>
    </header>
  );
}
