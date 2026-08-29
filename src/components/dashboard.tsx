'use client';

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import OnboardingShell from "./loginOnboarding/OnboardingShell";
import OnboardingWizardShell from "./loginOnboarding/OnboardingWizardShell";
import { OnboardingWizardProvider } from "./loginOnboarding/OnboardingWizardContext";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import LoginForm from "./loginOnboarding/loginForm";
import ProfileSetupFlow from "./loginOnboarding/ProfileSetupFlow";
import KycFlow from "../components/kyc/KycFlow";
import DocumentsUnderReviewScreen from "../components/status/DocumentsUnderReviewScreen";
import DesktopDocumentsUnderReview from "./loginOnboarding/desktop/DesktopDocumentsUnderReview";
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
  const isDesktop = useIsDesktopViewport();
  // Bridges IncomingBookingModal's accept action over to PartnerHomescreen's
  // tracking subview — the two are siblings below, not parent/child, so
  // this is the shared ancestor state that hands the booking id across. See
  // the prop comments on each for the full story.
  const [pendingTrackingBookingId, setPendingTrackingBookingId] = useState<string | null>(null);

  if (status === "loading" || isDesktop === null) return <FullScreenSpinner />;

  // Login/register -> work & location -> partner details -> verify identity
  // is the one stretch of the flow that gets the desktop wizard treatment
  // (persistent step sidebar) — see OnboardingWizardShell for why. Wrapped
  // in one shared OnboardingWizardProvider so its "which step is active"
  // state survives the LoginForm -> ProfileSetupFlow -> KycFlow handoffs
  // (each is a genuinely different component, swapped in by the status
  // below, not sub-steps of one component) instead of resetting between
  // them. Everything else (waiting/blocked screens, the real dashboard,
  // the training gate) keeps its existing full-screen treatment untouched
  // — the reference redesign this is based on only covered the active
  // registration/KYC steps.
  const WizardShell = isDesktop ? OnboardingWizardShell : OnboardingShell;

  if (status === "unauthenticated" || !partner) {
    return (
      <OnboardingWizardProvider>
        <WizardShell>
          <LoginForm />
        </WizardShell>
      </OnboardingWizardProvider>
    );
  }

  let screen: React.ReactNode;
  switch (partner.status) {
    case "INCOMPLETE":
      screen = (
        <OnboardingWizardProvider>
          <WizardShell>
            {(partner.onboardingStep ?? 1) < 2 ? <ProfileSetupFlow /> : <KycFlow />}
          </WizardShell>
        </OnboardingWizardProvider>
      );
      break;

    case "PENDING_KYC":
      screen = (
        <OnboardingWizardProvider>
          <WizardShell>
            <KycFlow />
          </WizardShell>
        </OnboardingWizardProvider>
      );
      break;

    // Desktop reuses the same wizard sidebar as the rest of the flow (with
    // the top bar enabled, and "Verify Identity" showing an "Under review"
    // badge instead of moving on to "Review & Submit" — see
    // DesktopDocumentsUnderReview). Mobile keeps its own dedicated
    // full-screen version exactly as it already was.
    case "KYC_SUBMITTED":
      screen = isDesktop ? (
        <OnboardingWizardProvider>
          <OnboardingWizardShell topBar>
            <DesktopDocumentsUnderReview />
          </OnboardingWizardShell>
        </OnboardingWizardProvider>
      ) : (
        <OnboardingShell>
          <DocumentsUnderReviewScreen />
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
      screen = (
        <PartnerHomescreen
          partner={partner}
          onLogout={() => logout()}
          pendingTrackingBookingId={pendingTrackingBookingId}
          onPendingBookingConsumed={() => setPendingTrackingBookingId(null)}
        />
      );
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
      <IncomingBookingModal enabled={partner.status === "APPROVED"} onAccepted={setPendingTrackingBookingId} />
    </>
  );
}
