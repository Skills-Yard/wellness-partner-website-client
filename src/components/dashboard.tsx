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
import PushNotificationBootstrap from "./notifications/PushNotificationBootstrap";
import IncomingBookingModal from "./notifications/IncomingBookingModal";

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

  let screen: React.ReactNode;
  switch (partner.status) {
    case "INCOMPLETE":
      screen = (
        <OnboardingShell>
          {(partner.onboardingStep ?? 1) < 2 ? <ProfileSetupFlow /> : <KycFlow />}
        </OnboardingShell>
      );
      break;

    case "PENDING_KYC":
      screen = (
        <OnboardingShell>
          <KycFlow />
        </OnboardingShell>
      );
      break;

    case "KYC_SUBMITTED":
      screen = (
        <OnboardingShell>
          <WaitingScreen
            title="Documents under review"
            description="We're verifying your documents. This usually takes 1-2 business days — check back soon."
          />
        </OnboardingShell>
      );
      break;

    // Mandatory training isn't done yet — nothing else in the dashboard is
    // reachable (not even a locked-looking preview of it), so this is its
    // own full screen rather than something PartnerHomescreen renders
    // inline. See TrainingGateScreen.
    case "TRAINING":
      screen = <TrainingGateScreen partner={partner} onLogout={() => logout()} />;
      break;

    // PENDING_APPROVAL and APPROVED both render the real dashboard —
    // training is already complete by PENDING_APPROVAL, so PartnerHomescreen
    // just locks the rest of its features (bookings, availability, ...)
    // until partner.status === APPROVED, rather than hiding the dashboard's
    // shape entirely.
    case "PENDING_APPROVAL":
    case "APPROVED":
      screen = <PartnerHomescreen partner={partner} onLogout={() => logout()} />;
      break;

    case "SUSPENDED":
    case "REJECTED":
    case "DEACTIVATED":
      screen = (
        <OnboardingShell>
          <BlockedScreen status={partner.status} />
        </OnboardingShell>
      );
      break;

    default:
      screen = <FullScreenSpinner />;
  }

  return (
    <>
      {screen}
      {/* Mounted once for every authenticated status — not just
          PENDING_APPROVAL/APPROVED — so a partner still in KYC/training
          gets pushes too (KYC approved/rejected, training reminders, ...).
          IncomingBookingModal's own polling is separately gated to APPROVED
          only, since on-demand broadcasts are never sent to anyone else. */}
      <PushNotificationBootstrap enabled />
      <IncomingBookingModal enabled={partner.status === "APPROVED"} />
    </>
  );
}
