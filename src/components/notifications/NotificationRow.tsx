"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/api/types";
import { timeAgo } from "./timeAgo";

// notification.type is a loose backend string with no enum exposed to this
// app (see the comment on NotificationItem in lib/api/types.ts) — this is a
// best-effort classifier off substrings so each row gets a category icon,
// never a source of truth for anything behavioral. Order matters (checked
// top to bottom); anything unrecognized falls back to a plain bell.
//
// The color itself is desktop-only (wrap/dot below are pre-scoped `sm:` —
// see NotificationRow) — the mobile card treatment (the reference this
// component was redesigned from) signals read/unread with a single accent
// instead of one color per category, so on narrow screens only the icon
// glyph varies by type, not its color.
function categoryFor(type: string): { icon: LucideIcon; wrap: string; dot: string } {
  const t = type.toUpperCase();
  if (t.includes("DISPUTE")) return { icon: AlertTriangle, wrap: "sm:bg-red-50 sm:text-red-600", dot: "sm:bg-red-500" };
  if (t.includes("CANCEL")) return { icon: XCircle, wrap: "sm:bg-stone-100 sm:text-stone-500", dot: "sm:bg-stone-400" };
  if (t.includes("PAYOUT") || t.includes("PAYMENT") || t.includes("EARNING")) {
    return { icon: IndianRupee, wrap: "sm:bg-green-50 sm:text-green-600", dot: "sm:bg-green-500" };
  }
  if (t.includes("ASSIGN") || t.includes("ACCEPT") || t.includes("CONFIRM")) {
    return { icon: CheckCircle2, wrap: "sm:bg-green-50 sm:text-green-600", dot: "sm:bg-green-500" };
  }
  if (t.includes("KYC") || t.includes("TRAIN") || t.includes("APPROV") || t.includes("DOCUMENT")) {
    return { icon: ShieldCheck, wrap: "sm:bg-blue-50 sm:text-blue-600", dot: "sm:bg-blue-500" };
  }
  if (t.includes("REVIEW") || t.includes("RATING")) {
    return { icon: Star, wrap: "sm:bg-[#FDF3E7] sm:text-[#C9851A]", dot: "sm:bg-[#C9851A]" };
  }
  if (t.includes("BOOKING") || t.includes("REQUEST") || t.includes("BROADCAST") || t.includes("OFFER")) {
    return { icon: CalendarClock, wrap: "sm:bg-[#FDF3E7] sm:text-[#C9851A]", dot: "sm:bg-[#C9851A]" };
  }
  return { icon: Bell, wrap: "sm:bg-stone-100 sm:text-stone-500", dot: "sm:bg-stone-400" };
}

export default function NotificationRow({
  notification,
  onOpenBooking,
  onRead,
}: {
  notification: NotificationItem;
  /** Called with the notification's bookingId (if it has one) on click —
   *  there's no per-page routing in this app, so a bookingId is the closest
   *  thing to a deeplink: the caller opens the Bookings panel. */
  onOpenBooking?: (bookingId: string) => void;
  /** Marks just this notification read — fired on click alongside
   *  onOpenBooking, so tapping any row (not only ones tied to a booking)
   *  clears its own unread state without waiting on "Mark all as read". */
  onRead?: (id: string) => void;
}) {
  const rawBookingId = notification.data?.bookingId;
  const bookingId = typeof rawBookingId === "string" ? rawBookingId : undefined;
  const { icon: Icon, wrap, dot } = categoryFor(notification.type);

  const handleClick = () => {
    if (!notification.isRead) onRead?.(notification.id);
    if (bookingId) onOpenBooking?.(bookingId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") handleClick();
      }}
      className={cn(
        // Mobile: its own rounded card (the reference design). Desktop
        // (sm:): flush back to a plain divided list — border-b instead of a
        // card border/shadow, no radius, no per-row gap (spacing comes from
        // the list wrapper instead — see NotificationsSidebar).
        "flex items-start gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-colors cursor-pointer hover:bg-stone-50",
        "sm:gap-2.5 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b sm:border-stone-50 sm:p-4 sm:shadow-none sm:last:border-b-0",
        !notification.isRead && "sm:bg-[#FDF3E7]/40",
      )}
    >
      <span
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-full sm:mt-3 sm:h-1.5 sm:w-1.5",
          notification.isRead ? "bg-stone-300" : "bg-[#C9851A]",
          !notification.isRead && dot,
        )}
        aria-hidden
      />
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9 sm:rounded-xl",
          notification.isRead ? "bg-stone-100 text-stone-400" : "bg-[#FDF3E7] text-[#C9851A]",
          wrap,
        )}
      >
        <Icon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate",
              notification.isRead ? "text-stone-700 font-medium" : "text-stone-900 font-bold",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 whitespace-nowrap text-[10px] text-stone-400 mt-0.5">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{notification.body}</p>
      </div>
    </div>
  );
}
