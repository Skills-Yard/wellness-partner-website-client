"use client";

import React, { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { startBooking } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";

/**
 * The client is shown a 4-digit "arrival code" (backend: Booking.arrivalOtp)
 * once the partner marks PARTNER_ARRIVED — they read it aloud in person, the
 * partner keys it in here, and POST /bookings/:id/start (BookingService.
 * startService) verifies it and flips the booking to IN_PROGRESS. This is
 * the only OTP in the booking lifecycle; completing the service afterwards
 * is a plain one-tap action with no code (see BookingsApi.completeBooking).
 *
 * Self-contained: owns its own open state and renders its own trigger, so it
 * drops into any booking card (BookingsPanel, TodayActivity's live card)
 * without the parent needing to lift dialog state.
 */
export default function StartServiceModal({
  bookingId,
  onStarted,
  trigger,
}: {
  bookingId: string;
  onStarted: () => void;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setOtp("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (busy) return; // don't let an in-flight verify get dismissed out from under itself
    setOpen(next);
    if (!next) reset();
  };

  const handleSubmit = async () => {
    if (otp.length !== 4) return;
    setBusy(true);
    setError(null);
    try {
      await startBooking(bookingId, otp);
      setOpen(false);
      reset();
      onStarted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify code. Try again.");
      setOtp("");
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
          className="max-w-xs rounded-3xl border-0 bg-white p-0 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <div className="bg-linear-to-br from-[#FDF3E7] to-white px-6 pt-6 pb-5 text-center border-b border-stone-100">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#F0DDBF] shadow-sm text-[#C9851A]">
              <KeyRound className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-extrabold text-stone-900">Start service</h2>
            <p className="mt-1 text-xs text-stone-500">
              Ask the client for the 4-digit code shown in their app.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="flex justify-center">
              <InputOTP
                maxLength={4}
                value={otp}
                onChange={setOtp}
                disabled={busy}
                autoFocus
                pattern="^[0-9]+$"
                onComplete={handleSubmit}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="size-11 text-base" />
                  <InputOTPSlot index={1} className="size-11 text-base" />
                  <InputOTPSlot index={2} className="size-11 text-base" />
                  <InputOTPSlot index={3} className="size-11 text-base" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-xs font-medium text-red-500 text-center mt-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={busy || otp.length !== 4}
              className="w-full mt-5 rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify &amp; start
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
