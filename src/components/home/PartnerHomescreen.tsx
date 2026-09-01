"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, CalendarClock, Briefcase, GraduationCap, Users, Star, TrendingUp, Lock, Landmark, Loader2, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import { useBookingStats, useCompletedBookings } from "@/hooks/queries/useBookings";
import { bucketWeeklyEarnings, formatINR } from "@/lib/earnings";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PartnerStatusHeader from "./PartnerStatusHeader";
import TodayActivity from "./TodayActivity";
import UpcomingBookingsCard from "./UpcomingBookingsCard";
import EarningsOverviewCard from "./EarningsOverviewCard";
import ProfilePage from "./ProfilePage";
import DesktopProfilePage from "./DesktopProfilePage";
import MoneyPage from "./MoneyPage";
import TrainingCenter, { TRAINING_JUST_COMPLETED_KEY } from "./TrainingCenter";
import TrainingCompleteModal from "./TrainingCompleteModal";
import BookingsPanel from "./panels/BookingsPanel";
import AvailabilityPanel from "./panels/AvailabilityPanel";
import TeamPanel from "./panels/TeamPanel";
import MembershipsPanel from "./panels/MembershipsPanel";
import BankAccountPanel from "./panels/BankAccountPanel";
import BookingTrackingPage from "./panels/BookingTrackingPage";
import EmployerBanner from "./EmployerBanner";
import NotificationsSidebar from "../notifications/NotificationsSidebar";
import type { Partner } from "@/lib/api/types";

interface PartnerHomescreenProps {
  partner: Partner;
  onLogout: () => void;
  // Set by DashboardContent right after IncomingBookingModal accepts an
  // on-demand offer — that modal is a sibling of this component (both
  // mount under DashboardContent), not a child, so there's no direct prop
  // path to open the tracking page from there; this is the lifted-state
  // handoff instead. onPendingBookingConsumed clears it once opened, so it
  // doesn't refire on unrelated re-renders.
  pendingTrackingBookingId?: string | null;
  onPendingBookingConsumed?: () => void;
}

// "notifications" isn't a SubView anymore — it's an overlay drawer
// (NotificationsSidebar) that sits on top of whatever's already open, not a
// destination that replaces `content`. See notificationsOpen below.
type SubView =
  | "bookings"
  | "availability"
  | "team"
  | "memberships"
  | "bank"
  | "training"
  | "tracking"
  | null;

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-stone-450">{label}</p>
        <p className="text-xl font-extrabold text-stone-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-stone-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ManageCard({
  icon,
  title,
  description,
  onClick,
  locked,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      aria-disabled={locked}
      className={`flex items-start gap-3.5 bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-left w-full transition-shadow ${
        locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-850">{title}</p>
        <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">
          {locked ? "Unlocks once approved" : description}
        </p>
      </div>
      {locked ? (
        <Lock className="h-4 w-4 text-stone-350 shrink-0 mt-0.5" />
      ) : (
        <ChevronRight className="h-5 w-5 text-stone-450 shrink-0 mt-0.5" />
      )}
    </button>
  );
}

export default function PartnerHomescreen({
  partner,
  onLogout,
  pendingTrackingBookingId,
  onPendingBookingConsumed,
}: PartnerHomescreenProps) {
  const { refreshProfile } = useAuth();
  const isDesktop = useIsDesktopViewport();
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");
  const [subView, setSubView] = useState<SubView>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [trackingBookingId, setTrackingBookingId] = useState<string | null>(null);
  const [showTrainingCelebration, setShowTrainingCelebration] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  const isApproved = partner.status === "APPROVED";
  // A BUSINESS partner can build out its team (and submit each employee's KYC)
  // as soon as its own KYC bundle is approved — i.e. from PENDING_APPROVAL
  // onwards — rather than waiting for full partner approval. Every other
  // manage destination stays gated on isApproved.
  const businessKycApproved =
    partner.type === "BUSINESS" && partner.kyc?.status === "APPROVED";
  // partner.totalBookings/completionRate come back 0 from the profile
  // endpoint regardless of actual history — derived from the real booking
  // list instead. See useBookingStats for why averageRating/totalReviews
  // can't get the same treatment.
  const bookingStats = useBookingStats(isApproved);
  // No earnings endpoint exists — the weekly total shown on the stat card is
  // derived from the same page of completed bookings the Earnings overview
  // chart uses (shared react-query cache, so this doesn't double-fetch).
  const completedBookings = useCompletedBookings(isApproved);
  const earningsThisWeek = bucketWeeklyEarnings(completedBookings.bookings, 0);

  // TrainingCenter sets this flag right before the completion that finishes
  // every mandatory course — that same action flips partner.status TRAINING
  // -> PENDING_APPROVAL server-side, which swaps TrainingGateScreen out for
  // this component in the same tick, so the celebration has to pick up here
  // instead of showing on the screen that's about to unmount.
  useEffect(() => {
    if (window.sessionStorage.getItem(TRAINING_JUST_COMPLETED_KEY) === "true") {
      window.sessionStorage.removeItem(TRAINING_JUST_COMPLETED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot flag read on mount, not a render-loop hazard
      setShowTrainingCelebration(true);
    }
  }, []);

  const handleCheckApproval = async () => {
    setCheckingApproval(true);
    try {
      await refreshProfile();
    } catch {
      // best-effort — partner can just try the button again
    } finally {
      setCheckingApproval(false);
    }
  };

  // Manage cards / sidebar entries route to a working panel only once the
  // partner is fully approved — before that (this component only ever
  // renders for PENDING_APPROVAL now; TRAINING goes to TrainingGateScreen
  // instead) they're shown locked rather than hidden, so the dashboard's
  // shape doesn't change out from under the partner the moment they're
  // approved. Training is the one exception — mandatory training is
  // already done by the time this component renders at all, so rewatching
  // it is never gated.
  const openSubView = (view: Exclude<SubView, null>) => {
    const allowedBeforeApproval =
      view === "training" ||
      view === "memberships" ||
      (view === "team" && businessKycApproved);
    if (!isApproved && !allowedBeforeApproval) return;
    setSubView(view);
  };

  // Notifications matter before approval too (KYC/training/approval updates
  // all arrive as pushes), so — like training — it's never gated. Not routed
  // through openSubView since the drawer isn't a subView (see SubView above).
  const openNotifications = () => setNotificationsOpen(true);

  // Switching top-level tabs always leaves any drill-down subview behind.
  const goToTab = (tab: "home" | "money" | "profile") => {
    setSubView(null);
    setActiveTab(tab);
  };

  const openTracking = (bookingId: string) => {
    setTrackingBookingId(bookingId);
    setSubView("tracking");
  };

  // Picks up an accept that just happened in IncomingBookingModal (see the
  // prop comment above) and opens straight into that booking's tracking
  // page, same as accepting from the Bookings list already does locally.
  useEffect(() => {
    if (!pendingTrackingBookingId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot handoff read from a prop that only changes on a real accept, not a render-loop hazard
    openTracking(pendingTrackingBookingId);
    onPendingBookingConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openTracking/onPendingBookingConsumed are stable closures over setState setters; only pendingTrackingBookingId should retrigger this
  }, [pendingTrackingBookingId]);

  let content: React.ReactNode;
  if (subView === "tracking" && trackingBookingId) {
    content = <BookingTrackingPage bookingId={trackingBookingId} onBack={() => setSubView(null)} />;
  } else if (subView === "bookings") {
    content = <BookingsPanel onBack={() => setSubView(null)} onOpenTracking={openTracking} />;
  } else if (subView === "availability") {
    content = <AvailabilityPanel partner={partner} onBack={() => setSubView(null)} />;
  } else if (subView === "team") {
    content = <TeamPanel onBack={() => setSubView(null)} />;
  } else if (subView === "memberships") {
    content = <MembershipsPanel onBack={() => setSubView(null)} />;
  } else if (subView === "bank") {
    content = <BankAccountPanel onBack={() => setSubView(null)} />;
  } else if (subView === "training") {
    content = <TrainingCenter partner={partner} onBack={() => setSubView(null)} />;
  } else if (activeTab === "profile") {
    // Desktop gets the full tabbed profile (personal info/banking/location,
    // completion tracker) — mobile keeps this exact ProfilePage untouched.
    // isDesktop is briefly null before the viewport check resolves; render
    // nothing rather than guess and flash the wrong one.
    content =
      isDesktop === null ? null : isDesktop ? (
        <DesktopProfilePage onManageAvailability={() => openSubView("availability")} />
      ) : (
        <ProfilePage partner={partner} onLogout={onLogout} onBack={() => goToTab("home")} onOpenBankAccount={() => openSubView("bank")} />
      );
  } else if (activeTab === "money") {
    content = <MoneyPage />;
  } else {
    const homeSubtitle = isApproved
      ? "Here's what's happening with your business today."
      : "Finish the steps below to get approved and start taking bookings.";
    content = (
      <div className="flex flex-col pb-28 lg:pb-10">
        <PartnerStatusHeader partner={partner} subtitle={homeSubtitle} onOpenNotifications={openNotifications} />

        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-10 py-6 flex flex-col gap-6">
          {/* Informational only — being on a business's team doesn't change how
              this partner's own bookings/availability/payouts work. */}
          {(partner.employers?.length ?? 0) > 0 && (
            <EmployerBanner
              employers={partner.employers ?? []}
              onOpen={() => openSubView("memberships")}
            />
          )}

          {/* Today's progress + live booking mini-tracker — only meaningful once bookings can actually flow in */}
          {isApproved && <TodayActivity onOpenBooking={openTracking} />}

          {/* This component only ever renders for PENDING_APPROVAL/APPROVED — TRAINING goes to
              TrainingGateScreen instead — so the only non-approved status left here is a final
              review already in progress; training material stays reachable via the sidebar/manage
              cards below rather than being shown inline again. */}
          {!isApproved && (
            <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-900">Pending final approval</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Your training is complete. Our team is doing a final review before you go live.
                </p>
              </div>
              <button
                onClick={handleCheckApproval}
                disabled={checkingApproval}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                {checkingApproval && <Loader2 className="h-3 w-3 animate-spin" />}
                Check now
              </button>
            </div>
          )}

          {/* Business owners can get a head start while the final review runs —
              add the team now so every employee's KYC is reviewed in the same
              pass as the business itself. */}
          {!isApproved && businessKycApproved && (
            <div className="rounded-2xl border border-[#F0DDBF] bg-[#FFF8EC] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-900">Set up your team</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Add the people who deliver services on your behalf and submit their KYC now — our team can review them alongside your application.
                </p>
              </div>
              <button
                onClick={() => openSubView("team")}
                className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#C9851A] text-white px-3.5 py-1.5 text-[11px] font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" /> Add team
              </button>
            </div>
          )}

          {/* Stats — meaningless before approval, so only shown once live */}
          {isApproved && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon={<Briefcase className="h-5 w-5" />}
                label="Total bookings"
                value={bookingStats.isLoading ? "…" : bookingStats.totalBookings}
                sub="all time"
              />
              <StatCard
                icon={<Star className="h-5 w-5" />}
                label="Average rating"
                value={partner.averageRating.toFixed(1)}
                sub={
                  partner.totalReviews > 0
                    ? `from ${partner.totalReviews} review${partner.totalReviews === 1 ? "" : "s"}`
                    : "no reviews yet"
                }
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Completion rate"
                value={bookingStats.isLoading ? "…" : `${Math.round(bookingStats.completionRate)}%`}
              />
              <StatCard
                icon={<Wallet className="h-5 w-5" />}
                label="Earnings this week"
                value={completedBookings.isLoading ? "…" : formatINR(earningsThisWeek.total)}
                sub={
                  completedBookings.isLoading
                    ? undefined
                    : `${earningsThisWeek.jobCount} job${earningsThisWeek.jobCount === 1 ? "" : "s"} completed`
                }
              />
            </div>
          )}

          {/* Manage — also reachable from the sidebar on desktop; kept here too so mobile (no sidebar) always has a way in */}
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mb-3">Manage your work</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <ManageCard
                icon={<Briefcase className="h-5 w-5" />}
                title="Bookings"
                description="View and manage all your bookings"
                onClick={() => openSubView("bookings")}
                locked={!isApproved}
              />
              <ManageCard
                icon={<CalendarClock className="h-5 w-5" />}
                title="Availability & slots"
                description="Set your availability and working hours"
                onClick={() => openSubView("availability")}
                locked={!isApproved}
              />
              {partner.type === "BUSINESS" && (
                <ManageCard
                  icon={<Users className="h-5 w-5" />}
                  title="Team"
                  description="Add team members and submit their KYC"
                  onClick={() => openSubView("team")}
                  locked={!isApproved && !businessKycApproved}
                />
              )}
              {partner.type !== "BUSINESS" && (
                <ManageCard
                  icon={<Users className="h-5 w-5" />}
                  title="Business memberships"
                  description="Join a business team or manage invitations"
                  onClick={() => openSubView("memberships")}
                />
              )}
              <ManageCard
                icon={<Landmark className="h-5 w-5" />}
                title="Bank account"
                description="Manage your payout and bank details"
                onClick={() => openSubView("bank")}
                locked={!isApproved}
              />
              <ManageCard
                icon={<Wallet className="h-5 w-5" />}
                title="Money"
                description="Track earnings, payouts and transfers"
                onClick={() => goToTab("money")}
              />
              <ManageCard
                icon={<GraduationCap className="h-5 w-5" />}
                title="Training"
                description="Learn and grow with Eezit Partner"
                onClick={() => openSubView("training")}
              />
            </div>
          </div>

          {/* Live snapshot — the partner's next jobs and this week's earnings
              trend, both driven off real booking data (see the two cards'
              own hooks). Approved-only: nothing to show before bookings can
              flow in. */}
          {isApproved && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <UpcomingBookingsCard
                  enabled={isApproved}
                  onViewAll={() => openSubView("bookings")}
                  onOpenBooking={openTracking}
                />
              </div>
              <div className="lg:col-span-2">
                <EarningsOverviewCard enabled={isApproved} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <Sidebar
        partner={partner}
        activeView={subView ?? activeTab}
        isApproved={isApproved}
        notificationsOpen={notificationsOpen}
        onNavigateTab={goToTab}
        onOpenSubView={openSubView}
        onOpenNotifications={openNotifications}
        onLogout={onLogout}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar partner={partner} onNavigateTab={goToTab} onOpenNotifications={openNotifications} onLogout={onLogout} />
        <div className="flex-1 min-w-0">{content}</div>
      </div>
      {subView === null && <BottomNav active={activeTab} onNavigate={goToTab} />}

      <NotificationsSidebar
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onOpenBooking={openTracking}
      />

      {showTrainingCelebration && (
        <TrainingCompleteModal
          onClose={() => setShowTrainingCelebration(false)}
          onCheckStatus={handleCheckApproval}
          checking={checkingApproval}
        />
      )}
    </div>
  );
}
