"use client";

import React from "react";
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
  onOpenNotifications,
}: {
  partner: Partner;
  onOpenNotifications: () => void;
}) {
  const isApproved = partner.status === "APPROVED";
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  return (
    <div className="w-full bg-linear-to-br from-[#FDF3E7] to-white border-b border-stone-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6 pb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PartnerAvatar
            partner={partner}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-[#F0DDBF] shadow-sm text-lg sm:text-xl text-[#C9851A] shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#C9851A]">{timeOfDayGreeting()}</p>
            <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 truncate leading-tight">
              {partner.name ?? "Partner"}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
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
          onClick={onOpenNotifications}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center shrink-0 cursor-pointer hover:bg-stone-50 transition-colors"
          aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-stone-600" strokeWidth={1.8} />
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
