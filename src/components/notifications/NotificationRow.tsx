"use client";

import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/api/types";
import { timeAgo } from "./timeAgo";

export default function NotificationRow({
  notification,
  onOpenBooking,
}: {
  notification: NotificationItem;
  /** Called with the notification's bookingId (if it has one) on click —
   *  there's no per-page routing in this app, so a bookingId is the closest
   *  thing to a deeplink: the caller opens the Bookings panel. */
  onOpenBooking?: (bookingId: string) => void;
}) {
  const rawBookingId = notification.data?.bookingId;
  const bookingId = typeof rawBookingId === "string" ? rawBookingId : undefined;

  const handleClick = () => {
    if (bookingId) onOpenBooking?.(bookingId);
  };

  return (
    <div
      role={bookingId ? "button" : undefined}
      tabIndex={bookingId ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (bookingId && (event.key === "Enter" || event.key === " ")) handleClick();
      }}
      className={cn(
        "flex gap-3 px-4 py-3 border-b border-stone-50 last:border-0 transition-colors",
        bookingId && "cursor-pointer hover:bg-stone-50",
        !notification.isRead && "bg-[#FDF3E7]/40",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          notification.isRead ? "bg-transparent" : "bg-[#C9851A]",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm truncate",
            notification.isRead ? "text-stone-700 font-medium" : "text-stone-900 font-bold",
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-[10px] text-stone-400 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  );
}
