"use client";

import React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useUpcomingBookings } from "@/hooks/queries/useBookings";
import { formatBookingWhen } from "@/lib/bookingSchedule";
import type { Booking, BookingStatus } from "@/lib/api/types";

const STATUS_CHIP: Partial<Record<BookingStatus, { label: string; cls: string }>> = {
  CONFIRMED: { label: "Confirmed", cls: "bg-green-50 text-green-700" },
  ACCEPTED: { label: "Accepted", cls: "bg-blue-50 text-blue-700" },
};

function serviceName(booking: Booking): string {
  return booking.items?.[0]?.serviceItemName ?? "Service booking";
}

/**
 * Top-of-dashboard callout for the partner's very next confirmed/accepted job.
 * Renders nothing when there isn't one, so it never sits on the home screen as
 * an empty placeholder — the full list still lives in UpcomingBookingsCard
 * further down. This just pulls the single most useful row up above the stats
 * and manage grid so it's never something the partner has to scroll for.
 * Shares useUpcomingBookings' query cache, so it's not an extra fetch.
 */
export default function NextBookingHighlight({
  enabled,
  onOpenBooking,
}: {
  enabled: boolean;
  onOpenBooking: (bookingId: string) => void;
}) {
  const { items } = useUpcomingBookings(enabled, 1);
  const next = items[0];
  if (!next) return null;

  const chip = STATUS_CHIP[next.status];

  return (
    <button
      onClick={() => onOpenBooking(next.id)}
      className="w-full text-left rounded-2xl border border-[#F0DDBF] bg-linear-to-br from-[#FFF8EC] to-white shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-3.5 w-3.5 text-[#C9851A]" />
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-[#C9851A]">
          Next booking
        </span>
        {chip && (
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${chip.cls}`}>
            {chip.label}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900 truncate">{serviceName(next)}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {formatBookingWhen(next)} · You earn ₹{next.partnerEarning.toFixed(0)}
          </p>
        </div>
        <span className="shrink-0 flex items-center gap-1 rounded-xl bg-stone-900 text-white px-3.5 py-2 text-xs font-bold">
          View <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
