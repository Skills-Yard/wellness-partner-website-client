"use client";

import React, { useEffect, useRef, useState } from "react";
import { Coffee, Clock3, Loader2 } from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import type { Booking, BookingStatus } from "@/lib/api/types";
import StartServiceModal from "@/components/booking/StartServiceModal";

// A booking counts as "live" once the partner is actively on it — en route,
// on-site, or mid-service. "Upcoming" is the next one that's confirmed but
// hasn't started yet. The two sets never overlap.
const LIVE_STATUSES: BookingStatus[] = ["PARTNER_EN_ROUTE", "PARTNER_ARRIVED", "IN_PROGRESS"];
const UPCOMING_STATUSES: BookingStatus[] = ["ACCEPTED", "CONFIRMED"];

const LIVE_STATUS_LABEL: Partial<Record<BookingStatus, string>> = {
  PARTNER_EN_ROUTE: "On the way",
  PARTNER_ARRIVED: "Arrived",
  IN_PROGRESS: "In progress",
};

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function serviceName(booking: Booking) {
  return booking.items?.[0]?.serviceItemName ?? "Booking";
}

function LiveBookingCard({
  booking,
  onAction,
  onOpenBookings,
}: {
  booking: Booking;
  onAction: () => void;
  onOpenBookings: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      onAction();
    } catch {
      // best-effort — partner can just retry the button
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#F0DDBF] bg-linear-to-br from-[#FFF8EC] to-white shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-red-500">Live now</span>
        <span className="ml-auto text-[11px] font-bold text-stone-500">
          {LIVE_STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </div>

      <p className="text-sm font-bold text-stone-900">{serviceName(booking)}</p>
      <p className="text-xs text-stone-500 mt-0.5">
        {booking.scheduledTime} · You earn ₹{booking.partnerEarning.toFixed(0)}
      </p>

      <div className="flex gap-2 mt-3">
        {booking.status === "PARTNER_EN_ROUTE" && (
          <button
            onClick={() => runAction(() => bookingsApi.markArrived(booking.id))}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            I&apos;ve arrived
          </button>
        )}
        {booking.status === "PARTNER_ARRIVED" && (
          <StartServiceModal
            bookingId={booking.id}
            onStarted={onAction}
            trigger={(open) => (
              <button
                onClick={open}
                disabled={busy}
                className="flex-1 rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                Enter code to start
              </button>
            )}
          />
        )}
        {booking.status === "IN_PROGRESS" && (
          <button
            onClick={() => runAction(() => bookingsApi.completeBooking(booking.id))}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Mark complete
          </button>
        )}
        <button
          onClick={onOpenBookings}
          className="rounded-xl py-2.5 px-4 text-xs font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
        >
          View
        </button>
      </div>

      {/* Full live tracking (map, ETA, timeline) is a later page — this card is the "mini" stand-in until then. */}
    </div>
  );
}

function TodayProgressCard({
  totalToday,
  completedToday,
  earningsToday,
  nextBooking,
}: {
  totalToday: number;
  completedToday: number;
  earningsToday: number;
  nextBooking: Booking | null;
}) {
  if (totalToday === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
          <Coffee className="h-5 w-5 text-[#C9851A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">You haven&apos;t started today</p>
          <p className="text-xs text-stone-500 mt-0.5">No bookings scheduled for today yet — new jobs will show up here.</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((completedToday / totalToday) * 100);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-stone-900">Today&apos;s progress</p>
        <span className="text-xs font-extrabold text-[#C9851A]">
          {completedToday}/{totalToday} done
        </span>
      </div>

      <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-4">
        <div
          className="h-full bg-[#C9851A] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500">Earned today</span>
        <span className="font-bold text-stone-900">₹{earningsToday.toFixed(0)}</span>
      </div>

      {nextBooking && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-50 text-xs text-stone-500">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          <span>
            Next up: {serviceName(nextBooking)} at {nextBooking.scheduledTime}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * "Today's progress" + a mini live-tracking card for whatever booking is
 * currently active. Asks the backend for just today's bookings directly
 * (`scheduledDate` filter) instead of walking the partner's entire booking
 * history and filtering client-side — this card only ever needs a handful
 * of rows, so a single bounded page (limit 100, comfortably above a day's
 * realistic booking count) replaces what used to be a full-history fetch
 * repeated on every mount and every 30s poll. Same fetch-on-mount pattern
 * as BookingsPanel/TrainingCenter elsewhere in this app; the only
 * difference here is a second effect that re-polls every 30s, but only
 * while a booking is actually live, so the card doesn't go stale mid-job
 * without the partner needing to manually reload. A full tracking page
 * (map, ETA, live updates) is later work — this is the stand-in until then,
 * so the polling is intentionally simple rather than a websocket.
 */
export default function TodayActivity({ onOpenBookings }: { onOpenBookings: () => void }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Holds the polling interval's id so the second effect below can start
  // and stop it as the live booking appears/disappears.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadBookings = async () => {
    try {
      const { data } = await bookingsApi.getBookingsPage(1, 100, {
        scheduledDate: todayDateString(),
      });
      setBookings(data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load today's bookings.");
    }
  };

  // Initial fetch on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render-loop hazard
    loadBookings();
  }, []);

  const liveBooking = bookings?.find((b) => LIVE_STATUSES.includes(b.status)) ?? null;

  // Start/stop the 30s poll as the live booking comes and goes. Keyed on
  // just its id (not the whole liveBooking object, which is a new
  // reference every fetch) so this doesn't tear down and restart the
  // interval on every poll tick — only when the live booking actually
  // changes or clears.
  useEffect(() => {
    if (!liveBooking) return;

    pollIntervalRef.current = setInterval(loadBookings, 30000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately keyed on liveBooking.id only, see comment above
  }, [liveBooking?.id]);

  if (bookings === null) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
      </div>
    );
  }

  // Already scoped to today server-side (getBookingsPage's scheduledDate
  // filter above) — no client-side date filtering needed any more.
  const todayBookings = bookings;
  const completedToday = todayBookings.filter((b) => b.status === "COMPLETED");
  const upcomingToday = todayBookings
    .filter((b) => UPCOMING_STATUSES.includes(b.status))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const earningsToday = completedToday.reduce((sum, b) => sum + b.partnerEarning, 0);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      {liveBooking && <LiveBookingCard booking={liveBooking} onAction={loadBookings} onOpenBookings={onOpenBookings} />}

      <TodayProgressCard
        totalToday={todayBookings.length}
        completedToday={completedToday.length}
        earningsToday={earningsToday}
        nextBooking={upcomingToday[0] ?? null}
      />
    </div>
  );
}
