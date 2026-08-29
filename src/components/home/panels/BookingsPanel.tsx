"use client";

import React, { useState } from "react";
import { ArrowLeft, ChevronRight, Loader2, Search } from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { isBookingOverdue } from "@/lib/bookingSchedule";
import type { Booking, BookingStatus } from "@/lib/api/types";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LoadMoreButton } from "@/components/ui/load-more-button";

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
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setActionError(null);
    try {
      await fn();
      onAction();
    } catch (err) {
      // A 409 here almost always means someone else got there first — either
      // another partner already accepted this broadcast, or the backend's
      // "one active booking at a time" rule kicked in (same ambiguity
      // IncomingBookingModal's popup handles) — surface that instead of
      // failing silently, so the partner isn't left tapping a dead button.
      setActionError(
        err instanceof ApiError
          ? err.status === 409
            ? "No longer available — it may have been taken by another partner."
            : err.message
          : "That didn't go through — please try again."
      );
    } finally {
      setBusy(null);
    }
  };

  const isBroadcast = booking.status === "BROADCASTED";
  // A booking never technically transitions out of ACCEPTED/CONFIRMED on
  // its own once its slot passes without being started — the backend has no
  // "missed" status — so this is caught client-side instead of trusting the
  // raw status to still mean "upcoming".
  const isMissed = !isBroadcast && isBookingOverdue(booking);

  return (
    <div
      onClick={isBroadcast ? undefined : () => onOpenTracking(booking.id)}
      className={`flex-1 min-w-65 max-w-sm rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4 ${
        isBroadcast
          ? ""
          : "cursor-pointer hover:bg-stone-100/60 transition-colors"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-stone-800">
          {booking.items?.[0]?.serviceItemName ?? "Service booking"}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isMissed ? "bg-red-50 text-red-700" : STATUS_COLORS[booking.status] ?? "bg-stone-100 text-stone-600"
          }`}
        >
          {isMissed ? "Missed" : booking.status.replace(/_/g, " ")}
        </span>
      </div>
      <p className="text-[11px] text-stone-500">
        {formatScheduledDate(booking.scheduledDate)} · {booking.scheduledTime}
      </p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-[11px] text-stone-400">
          You earn ₹{booking.partnerEarning.toFixed(0)}
        </p>
        {!isBroadcast && (
          <ChevronRight className="h-4 w-4 text-stone-350 shrink-0" />
        )}
      </div>

      {isBroadcast && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {actionError && (
            <p className="text-[11px] font-medium text-red-500 mb-2">{actionError}</p>
          )}
          <div className="flex gap-2">
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
              onClick={() =>
                run("reject", () =>
                  bookingsApi.rejectBooking(booking.id, "Not available"),
                )
              }
              disabled={busy !== null}
              className="flex-1 rounded-xl py-2 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-60"
            >
              {busy === "reject" && (
                <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" />
              )}
              Decline
            </button>
          </div>
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
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);

  const {
    items: bookings,
    isLoading,
    isFetchingNextPage,
    hasMore,
    loadMore,
    error,
    refetch,
  } = usePaginatedList<Booking>(
    ["partner-bookings", q],
    (page, limit) =>
      bookingsApi.getBookingsPage(page, limit, { q: q || undefined }),
    { limit: 20 },
  );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Bookings</h1>
      </div>

      <div className="px-5 sm:px-8 max-w-4xl w-full mx-auto">
        <div className="relative mb-4 max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or partner name"
            className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
          />
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}
        {!isLoading && bookings.length === 0 && (
          <p className="text-sm text-stone-400 py-8 text-center">
            {q ? "No bookings match your search." : "No bookings yet."}
          </p>
        )}
        {error && (
          <p className="text-xs font-medium text-red-500 mb-3">
            {error instanceof ApiError
              ? error.message
              : "Could not load your bookings."}
          </p>
        )}
        <div className="flex flex-row flex-wrap gap-3">
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              onAction={() => void refetch()}
              onOpenTracking={onOpenTracking}
            />
          ))}
        </div>
        {hasMore && (
          <LoadMoreButton onClick={loadMore} loading={isFetchingNextPage} />
        )}
      </div>
    </div>
  );
}
