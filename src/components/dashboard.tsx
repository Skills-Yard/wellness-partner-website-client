'use client';

import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import OnboardingShell from "./loginOnboarding/OnboardingShell";
import LoginForm from "./loginOnboarding/loginForm";
import ProfileSetupFlow from "./loginOnboarding/ProfileSetupFlow";
import KycFlow from "../components/kyc/KycFlow";
import WaitingScreen from "../components/status/WaitingScreen";
import BlockedScreen from "../components/status/BlockedScreen";
import PartnerHomescreen from "./home/PartnerHomescreen";
import TrainingGateScreen from "./home/TrainingGateScreen";

function FullScreenSpinner() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
    </div>
  );
}

/**
 * The single source of truth for what screen a partner sees, driven by
 * AuthProvider's session status and — once authenticated — the partner's
 * own PartnerStatus from the backend. There is no default-authenticated
 * bypass and no skip: an unauthenticated visitor always starts at the phone
 * step, and every state in between (KYC, training, pending approval, or a
 * blocked account) fully occupies the screen until it resolves.
 */
export default function DashboardContent() {
  const { status, partner, logout } = useAuth();

  if (status === "loading") return <FullScreenSpinner />;

  if (status === "unauthenticated" || !partner) {
    return (
      <OnboardingShell>
        <LoginForm />
      </OnboardingShell>
    );
  }

  switch (partner.status) {
    case "INCOMPLETE":
      return (
        <OnboardingShell>
          {(partner.onboardingStep ?? 1) < 2 ? <ProfileSetupFlow /> : <KycFlow />}
        </OnboardingShell>
      );

    case "PENDING_KYC":
      return (
        <OnboardingShell>
          <KycFlow />
        </OnboardingShell>
      );

    case "KYC_SUBMITTED":
      return (
        <OnboardingShell>
          <WaitingScreen
            title="Documents under review"
            description="We're verifying your documents. This usually takes 1-2 business days — check back soon."
          />
        </OnboardingShell>
      );

    // Mandatory training isn't done yet — nothing else in the dashboard is
    // reachable (not even a locked-looking preview of it), so this is its
    // own full screen rather than something PartnerHomescreen renders
    // inline. See TrainingGateScreen.
    case "TRAINING":
      return <TrainingGateScreen partner={partner} onLogout={() => logout()} />;

    // PENDING_APPROVAL and APPROVED both render the real dashboard —
    // training is already complete by PENDING_APPROVAL, so PartnerHomescreen
    // just locks the rest of its features (bookings, availability, ...)
    // until partner.status === APPROVED, rather than hiding the dashboard's
    // shape entirely.
    case "PENDING_APPROVAL":
    case "APPROVED":
      return <PartnerHomescreen partner={partner} onLogout={() => logout()} />;

    case "SUSPENDED":
    case "REJECTED":
    case "DEACTIVATED":
      return (
        <OnboardingShell>
          <BlockedScreen status={partner.status} />
        </OnboardingShell>
      );

    default:
      return <FullScreenSpinner />;
  }
}
