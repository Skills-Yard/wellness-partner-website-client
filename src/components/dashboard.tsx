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

    // TRAINING and PENDING_APPROVAL both render the real dashboard rather
    // than an isolated screen — PartnerHomescreen shows training progress
    // (TrainingSection) inline and locks the rest of the dashboard's
    // features until partner.status === APPROVED, so the partner sees their
    // eventual dashboard taking shape instead of a dead end.
    case "TRAINING":
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
