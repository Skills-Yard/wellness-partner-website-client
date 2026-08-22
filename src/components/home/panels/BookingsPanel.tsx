"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import type { Booking, BookingStatus } from "@/lib/api/types";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import StartServiceModal from "@/components/booking/StartServiceModal";
import CancelBookingModal from "@/components/booking/CancelBookingModal";
import DisputeBookingModal from "@/components/booking/DisputeBookingModal";

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

// Mirrors the backend's own gating (PaymentService.NON_CANCELLABLE_STATUSES /
// DISPUTABLE_STATUSES) so the button only ever shows when the call it fires
// would actually succeed — assigned-but-not-started for cancel, and
// happening-or-happened for a dispute.
const CANCELLABLE_STATUSES: BookingStatus[] = ["ACCEPTED", "CONFIRMED", "PARTNER_EN_ROUTE", "PARTNER_ARRIVED"];
const DISPUTABLE_STATUSES: BookingStatus[] = ["IN_PROGRESS", "COMPLETED"];

// scheduledDate is a real DateTime column on the backend, so it comes back
// as a full ISO instant (e.g. "2026-08-21T00:00:00.000Z") rather than a
// plain "YYYY-MM-DD" string — same thing AvailabilityPanel's formatDate and
// TodayActivity's today-matching had to account for.
function formatScheduledDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function BookingCard({ booking, onAction }: { booking: Booking; onAction: () => void }) {
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

  const actions: { key: string; label: string; run: () => Promise<unknown> }[] = [];
  if (booking.status === "BROADCASTED") {
    actions.push({ key: "accept", label: "Accept", run: () => bookingsApi.acceptBooking(booking.id) });
    actions.push({ key: "reject", label: "Decline", run: () => bookingsApi.rejectBooking(booking.id, "Not available") });
  } else if (booking.status === "ACCEPTED" || booking.status === "CONFIRMED") {
    actions.push({ key: "en-route", label: "On my way", run: () => bookingsApi.markEnRoute(booking.id) });
  } else if (booking.status === "PARTNER_EN_ROUTE") {
    actions.push({ key: "arrived", label: "I've arrived", run: () => bookingsApi.markArrived(booking.id) });
  } else if (booking.status === "IN_PROGRESS") {
    actions.push({ key: "complete", label: "Mark complete", run: () => bookingsApi.completeBooking(booking.id) });
  }
  // PARTNER_ARRIVED isn't a one-tap action — it needs the client's arrival
  // code, so it's rendered separately below via StartServiceModal.

  const showCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const showDispute = DISPUTABLE_STATUSES.includes(booking.status);

  return (
    <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4">
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
      <p className="text-[11px] text-stone-400 mt-0.5">
        You earn ₹{booking.partnerEarning.toFixed(0)}
      </p>
      {(actions.length > 0 || booking.status === "PARTNER_ARRIVED") && (
        <div className="flex gap-2 mt-3">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => run(a.key, a.run)}
              disabled={busy !== null}
              className="flex-1 rounded-xl py-2 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {busy === a.key && <Loader2 className="h-3 w-3 animate-spin" />}
              {a.label}
            </button>
          ))}
          {booking.status === "PARTNER_ARRIVED" && (
            <StartServiceModal
              bookingId={booking.id}
              onStarted={onAction}
              trigger={(open) => (
                <button
                  onClick={open}
                  disabled={busy !== null}
                  className="flex-1 rounded-xl py-2 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  Enter code to start
                </button>
              )}
            />
          )}
        </div>
      )}
      {(showCancel || showDispute) && (
        <div className="flex gap-2 mt-2">
          {showCancel && (
            <CancelBookingModal
              bookingId={booking.id}
              onCancelled={onAction}
              trigger={(open) => (
                <button
                  onClick={open}
                  disabled={busy !== null}
                  className="flex-1 rounded-xl py-2 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-60"
                >
                  Cancel booking
                </button>
              )}
            />
          )}
          {showDispute && (
            <DisputeBookingModal
              bookingId={booking.id}
              onDisputed={onAction}
              trigger={(open) => (
                <button
                  onClick={open}
                  disabled={busy !== null}
                  className="flex-1 rounded-xl py-2 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-100 transition-all cursor-pointer disabled:opacity-60"
                >
                  Report an issue
                </button>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingsPanel({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search);

  const { items: bookings, isLoading, isFetchingNextPage, hasMore, loadMore, error, refetch } =
    usePaginatedList<Booking>(
      ["partner-bookings", q],
      (page, limit) => bookingsApi.getBookingsPage(page, limit, { q: q || undefined }),
      { limit: 20 }
    );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Bookings</h1>
      </div>

      <div className="px-5 max-w-lg w-full">
        <div className="relative mb-4">
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
            {error instanceof ApiError ? error.message : "Could not load your bookings."}
          </p>
        )}
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} onAction={() => void refetch()} />
          ))}
        </div>
        {hasMore && <LoadMoreButton onClick={loadMore} loading={isFetchingNextPage} />}
      </div>
    </div>
  );
}
