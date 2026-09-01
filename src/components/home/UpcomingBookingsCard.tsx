"use client";

import React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useUpcomingBookings } from "@/hooks/queries/useBookings";
import { formatBookingWhen } from "@/lib/bookingSchedule";
import { Shimmer } from "@/components/ui/shimmer";
import type { Booking, BookingStatus } from "@/lib/api/types";

const STATUS_CHIP: Partial<Record<BookingStatus, { label: string; cls: string }>> = {
  CONFIRMED: { label: "Confirmed", cls: "bg-green-50 text-green-700" },
  ACCEPTED: { label: "Accepted", cls: "bg-blue-50 text-blue-700" },
};

function serviceName(booking: Booking): string {
  return booking.items?.[0]?.serviceItemName ?? "Service booking";
}

/**
 * Home dashboard's "Upcoming bookings" list — the partner's next few
 * confirmed/accepted jobs (see useUpcomingBookings). GET /partner/bookings'
 * list shape carries no customer name or photo (just userId), so rows lead
 * with the service and time rather than the client identity the mockup
 * sketches; tap through to the full tracking page for the rest.
 */
export default function UpcomingBookingsCard({
  enabled,
  onViewAll,
  onOpenBooking,
}: {
  enabled: boolean;
  onViewAll: () => void;
  onOpenBooking: (bookingId: string) => void;
}) {
  const { items, isLoading, isError } = useUpcomingBookings(enabled);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-base font-extrabold text-stone-900">Upcoming bookings</h3>
        <button
          onClick={onViewAll}
          className="rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          View all
        </button>
      </div>

      {isLoading ? (
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-3.5 w-2/5 rounded-full" />
                <Shimmer className="h-3 w-3/5 rounded-full" />
              </div>
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] mb-3">
            <CalendarClock className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-stone-900">No upcoming bookings</p>
          <p className="text-xs text-stone-500 mt-1">
            {isError
              ? "Couldn't load your bookings just now."
              : "New confirmed jobs will show up here."}
          </p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-stone-50">
          {items.map((booking) => {
            const chip = STATUS_CHIP[booking.status];
            return (
              <li key={booking.id}>
                <button
                  onClick={() => onOpenBooking(booking.id)}
                  className="w-full flex items-center gap-3 py-3 text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
                    <CalendarClock className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-850 truncate">
                      {serviceName(booking)}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatBookingWhen(booking)} · You earn ₹{booking.partnerEarning.toFixed(0)}
                    </p>
                  </div>
                  {chip && (
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${chip.cls}`}
                    >
                      {chip.label}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-stone-350 shrink-0 group-hover:text-stone-500 transition-colors" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
