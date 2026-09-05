"use client";

import React, { useEffect, useState } from "react";
import { Coffee, Clock3, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { isBookingOverdue } from "@/lib/bookingSchedule";
import { onPartnerSocketEvent } from "@/lib/socket/partnerSocket";
import type { Booking, BookingStatus } from "@/lib/api/types";

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
  onOpenBooking,
}: {
  booking: Booking;
  onOpenBooking: (bookingId: string) => void;
}) {
  return (
    <button
      onClick={() => onOpenBooking(booking.id)}
      className="w-full text-left rounded-2xl border border-[#F0DDBF] bg-linear-to-br from-[#FFF8EC] to-white shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
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

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900 truncate">{serviceName(booking)}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {booking.scheduledTime} · You earn ₹{booking.partnerEarning.toFixed(0)}
          </p>
        </div>
        <span className="shrink-0 flex items-center gap-1 rounded-xl bg-stone-900 text-white px-3.5 py-2 text-xs font-bold">
          Track <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

// A booking whose scheduled time has already passed while it was still
// ACCEPTED/CONFIRMED (never started) — surfaced separately rather than
// silently left in the "upcoming" bucket, where it would otherwise sit
// forever advertised as something still coming up.
function MissedBookingsCard({
  bookings,
  onOpenBooking,
}: {
  bookings: Booking[];
  onOpenBooking: (bookingId: string) => void;
}) {
  return (
    <button
      onClick={() => onOpenBooking(bookings[0].id)}
      className="w-full text-left rounded-2xl border border-red-100 bg-red-50/60 shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-red-500">
          {bookings.length === 1 ? "Missed booking" : `${bookings.length} missed bookings`}
        </span>
      </div>
      <p className="text-xs text-stone-600">
        {bookings.length === 1
          ? `${serviceName(bookings[0])} at ${bookings[0].scheduledTime} was never started.`
          : "These bookings' scheduled times passed without being started."}
      </p>
    </button>
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
 * realistic booking count) replaces what used to be a full-history fetch.
 * Same fetch-on-mount pattern as BookingsPanel/TrainingCenter elsewhere in
 * this app; the only difference here is a realtime-socket subscription (see
 * usePartnerRealtimeConnection) that reloads on booking:status-changed — a
 * client cancelling or disputing while a booking is live is the one thing
 * this card wouldn't otherwise learn about, since every other transition is
 * the partner's own action and already reflected locally by whatever
 * triggered it.
 */
export default function TodayActivity({ onOpenBooking }: { onOpenBooking: (bookingId: string) => void }) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Reload whenever the backend says a booking of ours changed status for a
  // reason that wasn't this partner's own action (see PartnerSocketGateway/
  // PaymentService — cancel/dispute by the client). No id filtering: the
  // event is rare enough that an extra reload of today's list is cheap, and
  // it could affect the upcoming/missed buckets too, not just the live card.
  useEffect(() => onPartnerSocketEvent("booking:status-changed", loadBookings), []);

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
  const missedToday = todayBookings.filter((b) => isBookingOverdue(b));
  const upcomingToday = todayBookings
    .filter((b) => UPCOMING_STATUSES.includes(b.status) && !isBookingOverdue(b))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const earningsToday = completedToday.reduce((sum, b) => sum + b.partnerEarning, 0);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      {liveBooking && <LiveBookingCard booking={liveBooking} onOpenBooking={onOpenBooking} />}

      {missedToday.length > 0 && <MissedBookingsCard bookings={missedToday} onOpenBooking={onOpenBooking} />}

      <TodayProgressCard
        totalToday={todayBookings.length}
        completedToday={completedToday.length}
        earningsToday={earningsToday}
        nextBooking={upcomingToday[0] ?? null}
      />
    </div>
  );
}
