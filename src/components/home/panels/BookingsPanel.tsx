"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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
        {booking.scheduledDate} · {booking.scheduledTime}
      </p>
      <p className="text-[11px] text-stone-400 mt-0.5">
        You earn ₹{(booking.partnerEarning / 100).toFixed(0)}
      </p>
      {actions.length > 0 && (
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
        </div>
      )}
    </div>
  );
}

export default function BookingsPanel({ onBack }: { onBack: () => void }) {
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

      <div className="px-5 max-w-lg w-full">
        {bookings === null && (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}
        {bookings?.length === 0 && <p className="text-sm text-stone-400 py-8 text-center">No bookings yet.</p>}
        {error && <p className="text-xs font-medium text-red-500 mb-3">{error}</p>}
        <div className="space-y-3">
          {bookings?.map((b) => (
            <BookingCard key={b.id} booking={b} onAction={load} />
          ))}
        </div>
      </div>
    </div>
  );
}
