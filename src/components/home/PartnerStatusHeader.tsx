"use client";

import React, { useState } from "react";
import { Bell, MapPin, Star } from "lucide-react";
import type { Partner } from "@/lib/api/types";
import { useUnreadNotificationCount } from "@/hooks/queries/useNotifications";
import PartnerAvatar from "./PartnerAvatar";

/**
 * Personalized identity header for the Home tab — replaces the old
 * marketing HeroBanner (generic "Earn upto ₹70,000" copy that ignored the
 * logged-in partner entirely) with a card driven by the partner's own
 * /partner/profile data: avatar initials, name, partner-type badge, city
 * and rating. Renders the same on mobile and desktop — the Sidebar
 * (desktop) / BottomNav (mobile) own navigation, so this stays focused on
 * "who is this and how are they doing" rather than duplicating chrome.
 *
 * isOnline deliberately isn't surfaced here — availability is set day-wise
 * on the Availability & slots panel, so a second control here would just
 * be a second source of truth for the same state.
 *
 * The notification bell here is hidden on lg — desktop gets the persistent
 * Topbar bell instead (same drawer), so the two never show at once.
 */
// Recomputed on every render (no need for a live-ticking clock here — the
// hour only needs to be roughly right, not to the second).
function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function PartnerStatusHeader({
  partner,
  subtitle,
  onOpenNotifications,
}: {
  partner: Partner;
  subtitle: string;
  onOpenNotifications: () => void;
}) {
  const isApproved = partner.status === "APPROVED";
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;
  // Bumped on every click, then used as the Bell icon's `key` below — since
  // a changed key forces React to unmount/remount, the bell-bounce keyframe
  // (see globals.css) restarts clean on every tap, even a rapid second one
  // that lands mid-bounce, rather than no-op'ing because the animation
  // class never actually changed.
  const [bounceKey, setBounceKey] = useState(0);

  const firstName = (partner.name ?? "Partner").trim().split(/\s+/)[0] || "Partner";

  return (
    <div className="relative w-full bg-linear-to-br from-[#FDF3E7] to-white border-b border-stone-100 overflow-hidden">
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-10 pt-6 pb-5 flex items-start justify-between gap-3">
        {/* Ambient decoration — echoes the mockup's illustration corner
            without pulling in an image asset. Anchored to the content box so
            it stays beside the greeting on ultrawide screens. Purely
            cosmetic, never interactive. */}
        <svg
          aria-hidden
          viewBox="0 0 200 120"
          className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 h-[80%] w-auto opacity-60 pointer-events-none"
        >
          <circle cx="150" cy="60" r="46" fill="none" stroke="#E9C893" strokeWidth="2" />
          <circle cx="150" cy="60" r="30" fill="#F6DFBB" opacity="0.5" />
          <circle cx="110" cy="28" r="10" fill="#EBCF9E" opacity="0.6" />
          <circle cx="178" cy="98" r="6" fill="#E4C48C" opacity="0.7" />
        </svg>

        <div className="flex items-start gap-3 min-w-0">
          <PartnerAvatar
            partner={partner}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-[#F0DDBF] shadow-sm text-lg sm:text-xl text-[#C9851A] shrink-0"
          />
          <div className="min-w-0">
            <h1 className="flex items-center gap-1.5 text-lg sm:text-2xl font-extrabold text-stone-900 leading-tight min-w-0">
              <span className="truncate">
                {timeOfDayGreeting()}, {firstName}!
              </span>
              <span aria-hidden className="shrink-0">
                👋
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">{subtitle}</p>
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 bg-white border border-[#F0DDBF] text-[#C9851A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {partner.type === "BUSINESS" ? "Eezit Business Partner" : "Eezit Partner"}
              </span>
              {partner.city && (
                <span className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" />
                  {partner.city}
                </span>
              )}
              {isApproved && partner.totalReviews > 0 && (
                <span className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                  {partner.averageRating.toFixed(1)} ({partner.totalReviews})
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setBounceKey((k) => k + 1);
            onOpenNotifications();
          }}
          className="lg:hidden relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center shrink-0 cursor-pointer hover:bg-stone-50 active:scale-90 transition-all"
          aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell key={bounceKey} className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-600 animate-bell-bounce" strokeWidth={1.8} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9851A] opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#C9851A] text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
