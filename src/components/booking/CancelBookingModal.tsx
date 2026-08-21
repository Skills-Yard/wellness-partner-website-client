"use client";

import React, { useState } from "react";
import { Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cancelBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";

const CANCEL_REASONS = [
  "Can't make it in time",
  "Personal emergency",
  "Vehicle or equipment issue",
];

/**
 * POST /bookings/:id/cancel (PaymentService.cancelBooking) — reason is
 * optional on the backend DTO, but we still ask so the client/admin has
 * something to go on. Only rendered for bookings still in a cancellable
 * status (assigned but not yet IN_PROGRESS — see
 * PaymentService.NON_CANCELLABLE_STATUSES); the caller decides when to show
 * the trigger.
 */
export default function CancelBookingModal({
  bookingId,
  onCancelled,
  trigger,
}: {
  bookingId: string;
  onCancelled: () => void;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  const reset = () => {
    setError(null);
    setCustomReason("");
  };

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleCancel = async (reason: string) => {
    setBusy(true);
    setError(null);
    try {
      await cancelBooking(bookingId, reason);
      setOpen(false);
      reset();
      onCancelled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel this booking.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={!busy}
          className="max-w-sm rounded-3xl border-0 bg-white p-0 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <div className="px-6 pt-6 pb-5 text-center border-b border-stone-100">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-500">
              <XCircle className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">Cancel this booking?</h2>
            <p className="mt-1 text-xs text-stone-500">
              The client will be notified and the slot released.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="flex flex-col gap-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleCancel(reason)}
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
                onClick={() => handleOpenChange(false)}
                disabled={busy}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-60"
              >
                Never mind
              </button>
              <button
                onClick={() => handleCancel(customReason.trim())}
                disabled={busy || !customReason.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
