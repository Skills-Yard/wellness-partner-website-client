"use client";

import React, { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { disputeBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";

/**
 * POST /bookings/:id/dispute (PaymentService.raiseDispute) — reason is
 * required on the backend DTO (@IsNotEmpty). Only valid from IN_PROGRESS or
 * COMPLETED (PaymentService.DISPUTABLE_STATUSES); the caller decides when to
 * show the trigger. Flips the booking to DISPUTED for an admin to resolve —
 * doesn't touch payment by itself.
 */
export default function DisputeBookingModal({
  bookingId,
  onDisputed,
  trigger,
}: {
  bookingId: string;
  onDisputed: () => void;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const reset = () => {
    setError(null);
    setReason("");
  };

  const handleOpenChange = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await disputeBooking(bookingId, trimmed);
      setOpen(false);
      reset();
      onDisputed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not raise a dispute.");
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
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">Report an issue</h2>
            <p className="mt-1 text-xs text-stone-500">
              This flags the booking for our team to review — it doesn&apos;t change any payment on its own.
            </p>
          </div>

          <div className="px-6 py-5">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened?"
              rows={4}
              autoFocus
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 resize-none"
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
                onClick={handleSubmit}
                disabled={busy || !reason.trim()}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
