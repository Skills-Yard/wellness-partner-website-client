"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * The phone-frame shell every pre-approval screen renders inside: full
 * screen on mobile, a fixed-size dialog frame on desktop. Extracted from the
 * original login modal so every onboarding/KYC/waiting/training/blocked
 * screen shares the same presentation, with no way to dismiss it (no
 * onOpenChange close path) — the whole point is this flow can't be skipped.
 */
export default function OnboardingShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile === null) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <Dialog open={true}>
      <DialogContent
        className="flex flex-col p-0 overflow-hidden bg-white border border-stone-100 shadow-2xl gap-0 outline-none animate-in fade-in duration-200"
        style={{
          width: "390px",
          height: "min(844px, 92vh)",
          borderRadius: "38px",
          maxWidth: "390px",
        }}
        showCloseButton={false}
      >
        <h2 className="sr-only">Vellora Partner Onboarding</h2>
        {children}
      </DialogContent>
    </Dialog>
  );
}
