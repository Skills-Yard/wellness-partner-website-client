"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

// The 5 steps shown in the desktop wizard's sidebar. Deliberately more
// granular than the top-level auth/partner status this flow is actually
// driven by (LoginForm covers "login", ProfileSetupFlow covers
// "work_location" + "partner_details") — each relevant component calls
// setActiveStep as it moves through its own internal phases, so the
// sidebar can highlight the right one even though it's rendered one level
// up, wrapping whichever component dashboard.tsx currently has mounted.
//
// "review" comes before "verify_identity" here, not after: "Review &
// Submit" covers the whole of DesktopKycForm — filling in documents,
// reviewing them, and clicking submit — while "Verify Identity" is
// reserved for what happens after that, once submitted: the actual
// verification (status KYC_SUBMITTED, DesktopDocumentsUnderReview), which
// is why it's the last step rather than the one before review.
export type WizardStepId = "login" | "work_location" | "partner_details" | "review" | "verify_identity";

export const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: "login", label: "Login / Register" },
  { id: "work_location", label: "Work & Location" },
  { id: "partner_details", label: "Partner Details" },
  { id: "review", label: "Review & Submit" },
  { id: "verify_identity", label: "Verify Identity" },
];

interface OnboardingWizardContextValue {
  activeStep: WizardStepId;
  setActiveStep: (step: WizardStepId) => void;
  // A small pill shown next to the active step's label — e.g. "Under
  // review" while KYC_SUBMITTED reuses the "Verify Identity" slot rather
  // than getting its own sidebar entry (there's no separate step for it in
  // the actual status machine). null for the normal, badge-less steps.
  activeStepBadge: string | null;
  setActiveStepBadge: (badge: string | null) => void;
}

const OnboardingWizardContext = createContext<OnboardingWizardContextValue | null>(null);

export function OnboardingWizardProvider({ children }: { children: React.ReactNode }) {
  const [activeStep, setActiveStep] = useState<WizardStepId>("login");
  const [activeStepBadge, setActiveStepBadge] = useState<string | null>(null);
  const value = useMemo(
    () => ({ activeStep, setActiveStep, activeStepBadge, setActiveStepBadge }),
    [activeStep, activeStepBadge]
  );
  return <OnboardingWizardContext.Provider value={value}>{children}</OnboardingWizardContext.Provider>;
}

/**
 * Only ever needed by the desktop wizard's step components (to report
 * "I'm active now") and OnboardingWizardShell (to read it back for the
 * sidebar) — mobile's step components never call this, so this being
 * unavailable there is a non-issue in practice, but it's still provided
 * unconditionally from the same place both layouts mount under, rather
 * than conditionally, so no component needs an is-this-context-here check.
 */
export function useOnboardingWizardStep() {
  const ctx = useContext(OnboardingWizardContext);
  if (!ctx) throw new Error("useOnboardingWizardStep must be used within an OnboardingWizardProvider");
  return ctx;
}
