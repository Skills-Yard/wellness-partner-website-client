"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import type { Booking, BookingStatus } from "@/lib/api/types";

const STATUS_COLORS: Partial<Record<BookingStatus, string>> = {
  BROADCASTED: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
  PARTNER_EN_ROUTE: "bg-blue-50 text-blue-700",
  PARTNER_ARRIVED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED_BY_CLIENT: "bg-stone-100 text-stone-500",
  CANCELLED_BY_PARTNER: "bg-stone-100 text-stone-500",
  CANCELLED_BY_ADMIN: "bg-stone-100 text-stone-500",
  DISPUTED: "bg-red-50 text-red-700",
};

// scheduledDate is a real DateTime column on the backend, so it comes back
// as a full ISO instant (e.g. "2026-08-21T00:00:00.000Z") rather than a
// plain "YYYY-MM-DD" string — same thing AvailabilityPanel's formatDate and
// TodayActivity's today-matching had to account for.
function formatScheduledDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * One card per booking, laid out in a flex-wrap grid (see the list
 * container below) — status/basics only, tap through to BookingTrackingPage
 * for everything actionable (en route/arrived/start/complete/cancel/dispute
 * all live there now, not duplicated here). The one exception is
 * Accept/Decline on a still-BROADCASTED booking: there's nothing to track
 * yet at that point, so responding to the offer has to stay a list-level
 * action — same as IncomingBookingModal's popup offers.
 */
function BookingRow({
  booking,
  onAction,
  onOpenTracking,
}: {
  booking: Booking;
  onAction: () => void;
  onOpenTracking: (bookingId: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      onAction();
    } catch {
      // best-effort — user can retry
    } finally {
      setBusy(null);
    }
  };

  const isBroadcast = booking.status === "BROADCASTED";

  return (
    <div
      onClick={isBroadcast ? undefined : () => onOpenTracking(booking.id)}
      className={`flex-1 min-w-65 max-w-sm rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4 ${
        isBroadcast ? "" : "cursor-pointer hover:bg-stone-100/60 transition-colors"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-stone-800">
          {booking.items?.[0]?.serviceItemName ?? "Service booking"}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            STATUS_COLORS[booking.status] ?? "bg-stone-100 text-stone-600"
          }`}
        >
          {booking.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-[11px] text-stone-500">
        {formatScheduledDate(booking.scheduledDate)} · {booking.scheduledTime}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[11px] text-stone-400">You earn ₹{booking.partnerEarning.toFixed(0)}</p>
        {!isBroadcast && <ChevronRight className="h-4 w-4 text-stone-350 shrink-0" />}
      </div>

      {isBroadcast && (
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() =>
              run("accept", async () => {
                await bookingsApi.acceptBooking(booking.id);
                onOpenTracking(booking.id);
              })
            }
            disabled={busy !== null}
            className="flex-1 rounded-xl py-2 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy === "accept" && <Loader2 className="h-3 w-3 animate-spin" />}
            Accept
          </button>
          <button
            onClick={() => run("reject", () => bookingsApi.rejectBooking(booking.id, "Not available"))}
            disabled={busy !== null}
            className="flex-1 rounded-xl py-2 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-60"
          >
            {busy === "reject" && <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" />}
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingsPanel({
  onBack,
  onOpenTracking,
}: {
  onBack: () => void;
  onOpenTracking: (bookingId: string) => void;
}) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await bookingsApi.getBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your bookings.");
      setBookings([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render-loop hazard
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Bookings</h1>
      </div>

      <div className="px-5 max-w-5xl w-full mx-auto">
        {bookings === null && (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}
        {bookings?.length === 0 && <p className="text-sm text-stone-400 py-8 text-center">No bookings yet.</p>}
        {error && <p className="text-xs font-medium text-red-500 mb-3">{error}</p>}
        <div className="flex flex-wrap gap-4">
          {bookings?.map((b) => (
            <BookingRow key={b.id} booking={b} onAction={load} onOpenTracking={onOpenTracking} />
          ))}
        </div>
      </div>
    </div>
  );
}
