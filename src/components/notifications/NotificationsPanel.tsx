"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useMarkAllNotificationsRead, useNotifications } from "@/hooks/queries/useNotifications";
import NotificationRow from "./NotificationRow";

const PAGE_SIZE = 20;

export default function NotificationsPanel({
  onBack,
  onOpenBooking,
}: {
  onBack: () => void;
  /** See NotificationRow — opens the Bookings panel for a notification tied to a bookingId. */
  onOpenBooking: (bookingId: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: notifications = [], pagination, isLoading } = useNotifications(visibleCount);
  const markAllRead = useMarkAllNotificationsRead();

  // Opening this panel is treated as "seeing" the notifications — marks
  // everything currently unread as read (clearing the bell's badge) while
  // the list stays browsable, now all read, for as long as it's revisited.
  useEffect(() => {
    markAllRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The backend now returns a real total (pagination.total) alongside this
  // `take`-limited list — use it directly instead of guessing "a full page
  // probably means there's more" from length vs. requested count.
  const canLoadMore = pagination ? notifications.length < pagination.total : false;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Notifications</h1>
      </div>

      <div className="px-5 max-w-lg w-full mx-auto">
        {isLoading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="mb-3 h-8 w-8 text-stone-300" strokeWidth={1.5} />
            <p className="text-sm text-stone-400">
              Nothing here yet — booking updates and offers will show up as they happen.
            </p>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="rounded-2xl border border-stone-100 overflow-hidden">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpenBooking={onOpenBooking} />
            ))}
          </div>
        )}

        {canLoadMore && (
          <button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="mt-4 w-full rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
