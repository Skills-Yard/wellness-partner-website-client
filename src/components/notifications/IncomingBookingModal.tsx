"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, IndianRupee, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { acceptBooking, rejectBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { useIncomingBroadcasts } from "@/hooks/queries/useIncomingBroadcasts";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { IncomingBroadcast } from "@/lib/api/types";

const DECLINE_REASONS = ["Too far from my location", "Not available right now", "Price too low"];

/**
 * The "big popup" the partner-side wants that the client app never needed:
 * an on-demand booking broadcast (FCFS matchmaking — see backend
 * FcfsDispatchConsumer) is a live offer another nearby partner can win at
 * any moment, so it gets a full-screen, not-casually-dismissible modal
 * instead of a toast — Accept/Decline are the only ways out.
 *
 * Driven entirely off useIncomingBroadcasts's polled/pushed cache: whichever
 * offer is oldest is shown; accepting or declining (or the offer simply
 * disappearing because someone else won it / it timed out) advances to the
 * next one automatically since there's no separate "dismissed" bookkeeping.
 */
export default function IncomingBookingModal({
  enabled,
  onAccepted,
}: {
  enabled: boolean;
  // This modal is a sibling of PartnerHomescreen (both mount directly under
  // DashboardContent), not a child of it, so there's no direct prop path to
  // the tracking page from here — DashboardContent lifts a bit of state to
  // bridge the two: this fires on a successful accept, PartnerHomescreen
  // picks it up via its pendingTrackingBookingId prop.
  onAccepted?: (bookingId: string) => void;
}) {
  const { data } = useIncomingBroadcasts(enabled);

  const pending = (data ?? [])
    .filter((b) => b.response === "PENDING")
    .sort((a, b) => a.broadcastedAt.localeCompare(b.broadcastedAt));
  const current = pending[0];
  const moreWaiting = pending.length - 1;

  if (!current) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="max-w-sm rounded-3xl border-0 bg-white p-0 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        {/* Keyed by broadcast id: a new offer taking over the modal always
            mounts fresh on the main Accept/Decline screen, never mid-reason-
            picker (or mid-error) left over from whatever it replaced — no
            reset effect needed, the remount does it. */}
        <OfferPrompt key={current.id} broadcast={current} moreWaiting={moreWaiting} onAccepted={onAccepted} />
      </DialogContent>
    </Dialog>
  );
}

function OfferPrompt({
  broadcast,
  moreWaiting,
  onAccepted,
}: {
  broadcast: IncomingBroadcast;
  moreWaiting: number;
  onAccepted?: (bookingId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"offer" | "reason">("offer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.incomingBroadcasts() });

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    try {
      await acceptBooking(broadcast.bookingId);
      await refresh();
      onAccepted?.(broadcast.bookingId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("This job was just taken by another partner.");
        setTimeout(refresh, 1500);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not accept this booking.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async (reason: string) => {
    setBusy(true);
    setError(null);
    try {
      await rejectBooking(broadcast.bookingId, reason);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not decline this booking.");
      setBusy(false);
    }
  };

  const booking = broadcast.booking;
  const serviceNames = booking.items.map((item) => item.serviceItemName).join(", ") || "Service booking";
  const earning = booking.partnerEarning.toFixed(0);
  const address = [booking.address.city, booking.address.pincode].filter(Boolean).join(" · ");

  if (step === "reason") {
    return (
      <div className="px-6 py-6">
        <h2 className="text-base font-extrabold text-stone-900">Why are you declining?</h2>
        <p className="text-xs text-stone-500 mt-1">This helps us send you better-matched offers.</p>

        <div className="mt-4 flex flex-col gap-2">
          {DECLINE_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => handleDecline(reason)}
              disabled={busy}
              className="w-full text-left rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer disabled:opacity-60"
            >
              {reason}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
          Or write your own
        </p>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Type your reason…"
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 resize-none"
        />

        {error && <p className="text-xs font-medium text-red-500 mt-2">{error}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setStep("offer")}
            disabled={busy}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-60"
          >
            Back
          </button>
          <button
            onClick={() => handleDecline(customReason.trim())}
            disabled={busy || !customReason.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="bg-linear-to-br from-[#FDF3E7] to-white px-6 pt-6 pb-5 text-center border-b border-stone-100">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#F0DDBF] shadow-sm text-[#C9851A]">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-lg font-extrabold text-stone-900">New Booking Request</h2>
        <p className="mt-1 text-xs text-stone-500">
          Respond quickly — this offer can go to another partner.
        </p>
      </div>

      <div className="px-6 py-5 space-y-3">
        <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4">
          <p className="text-sm font-bold text-stone-900">{serviceNames}</p>
          <p className="text-xs text-stone-500 mt-1">
            {booking.scheduledDate} · {booking.scheduledTime}
          </p>
          {address && (
            <p className="flex items-center gap-1 text-xs text-stone-500 mt-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {address}
            </p>
          )}
          <p className="flex items-center gap-1 text-sm font-extrabold text-[#C9851A] mt-2">
            <IndianRupee className="h-3.5 w-3.5" />
            {earning} you earn
          </p>
        </div>

        {moreWaiting > 0 && (
          <p className="text-center text-[11px] text-stone-400">
            +{moreWaiting} more offer{moreWaiting > 1 ? "s" : ""} waiting after this one
          </p>
        )}

        {error && <p className="text-xs font-medium text-red-500 text-center">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => setStep("reason")}
            disabled={busy}
            className="flex-1 rounded-xl py-3 text-sm font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={busy}
            className="flex-1 rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
