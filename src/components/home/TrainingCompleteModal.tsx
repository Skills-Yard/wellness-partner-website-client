"use client";

import React from "react";
import { Loader2, PartyPopper, X } from "lucide-react";

const CONFETTI = [
  { left: "12%", color: "#C9851A", delay: "0ms" },
  { left: "24%", color: "#FFD580", delay: "80ms" },
  { left: "38%", color: "#8C6318", delay: "40ms" },
  { left: "50%", color: "#C9851A", delay: "160ms" },
  { left: "62%", color: "#FFD580", delay: "20ms" },
  { left: "76%", color: "#8C6318", delay: "120ms" },
  { left: "88%", color: "#C9851A", delay: "60ms" },
];

/**
 * Shown once, right after the last mandatory training course completes —
 * see PartnerHomescreen, which reads a one-shot sessionStorage flag on
 * mount (set by TrainingCenter at the moment of that completion) rather
 * than this modal living inside TrainingGateScreen itself: that screen is
 * what gets unmounted the instant refreshProfile() flips partner.status
 * TRAINING -> PENDING_APPROVAL, so there'd be no reliable moment to render
 * it there.
 */
export default function TrainingCompleteModal({
  onClose,
  onCheckStatus,
  checking,
}: {
  onClose: () => void;
  onCheckStatus: () => void;
  checking: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative w-16 h-16 mx-auto mb-4">
          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-1.5 rounded-sm animate-confetti"
              style={{ left: piece.left, backgroundColor: piece.color, animationDelay: piece.delay }}
            />
          ))}
          <div className="w-16 h-16 rounded-full bg-[#FDF3E7] flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-[#C9851A]" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-stone-900">Congratulations!</h2>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">
          You&apos;ve completed all your mandatory training. Our team will now review your profile — we&apos;ll let
          you know as soon as you&apos;re approved to start taking bookings.
        </p>

        <button
          onClick={onCheckStatus}
          disabled={checking}
          className="mt-6 w-full rounded-2xl py-3 font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {checking && <Loader2 className="h-4 w-4 animate-spin" />}
          Check approval status
        </button>
        <button
          onClick={onClose}
          className="mt-2.5 w-full rounded-2xl py-2.5 font-bold text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
        >
          I&apos;ll check back later
        </button>
      </div>
    </div>
  );
}
