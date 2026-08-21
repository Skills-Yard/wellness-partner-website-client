"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, CalendarClock, Briefcase, GraduationCap, Users, Star, TrendingUp, Lock, Landmark, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import PartnerStatusHeader from "./PartnerStatusHeader";
import TodayActivity from "./TodayActivity";
import ProfilePage from "./ProfilePage";
import DesktopProfilePage from "./DesktopProfilePage";
import MoneyPage from "./MoneyPage";
import TrainingCenter, { TRAINING_JUST_COMPLETED_KEY } from "./TrainingCenter";
import TrainingCompleteModal from "./TrainingCompleteModal";
import BookingsPanel from "./panels/BookingsPanel";
import AvailabilityPanel from "./panels/AvailabilityPanel";
import TeamPanel from "./panels/TeamPanel";
import BankAccountPanel from "./panels/BankAccountPanel";
import type { Partner } from "@/lib/api/types";

interface PartnerHomescreenProps {
  partner: Partner;
  onLogout: () => void;
}

type SubView = "bookings" | "availability" | "team" | "bank" | "training" | null;

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-stone-900 leading-none">{value}</p>
        <p className="text-[11px] text-stone-450 mt-1">{label}</p>
      </div>
    </div>
  );
}

function ManageCard({
  icon,
  title,
  onClick,
  locked,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      aria-disabled={locked}
      className={`flex items-center gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-left w-full transition-shadow ${
        locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-md"
      }`}
    >
      <div className="w-11 h-11 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-850">{title}</p>
        {locked && <p className="text-[11px] text-stone-400 mt-0.5">Unlocks once approved</p>}
      </div>
      {locked ? (
        <Lock className="h-4 w-4 text-stone-350 shrink-0" />
      ) : (
        <ChevronRight className="h-5 w-5 text-stone-450 shrink-0" />
      )}
    </button>
  );
}

export default function PartnerHomescreen({ partner, onLogout }: PartnerHomescreenProps) {
  const { refreshProfile } = useAuth();
  const isDesktop = useIsDesktopViewport();
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");
  const [subView, setSubView] = useState<SubView>(null);
  const [showTrainingCelebration, setShowTrainingCelebration] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);

  const isApproved = partner.status === "APPROVED";

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
    if (view !== "training" && !isApproved) return;
    setSubView(view);
  };

  // Switching top-level tabs always leaves any drill-down subview behind.
  const goToTab = (tab: "home" | "money" | "profile") => {
    setSubView(null);
    setActiveTab(tab);
  };

  let content: React.ReactNode;
  if (subView === "bookings") {
    content = <BookingsPanel onBack={() => setSubView(null)} />;
  } else if (subView === "availability") {
    content = <AvailabilityPanel partner={partner} onBack={() => setSubView(null)} />;
  } else if (subView === "team") {
    content = <TeamPanel onBack={() => setSubView(null)} />;
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
    content = (
      <div className="flex flex-col pb-28 lg:pb-10">
        <PartnerStatusHeader partner={partner} />

        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
          <p className="text-sm text-stone-500 -mt-2">
            {isApproved
              ? `You're live in ${partner.city ?? "your area"} as an approved Eezit partner.`
              : "Finish the steps below to get approved and start taking bookings."}
          </p>

          {/* Today's progress + live booking mini-tracker — only meaningful once bookings can actually flow in */}
          {isApproved && <TodayActivity onOpenBookings={() => openSubView("bookings")} />}

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

          {/* Stats — meaningless before approval, so only shown once live */}
          {isApproved && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard icon={<Briefcase className="h-5 w-5" />} label="Total bookings" value={partner.totalBookings} />
              <StatCard icon={<Star className="h-5 w-5" />} label="Average rating" value={partner.averageRating.toFixed(1)} />
              <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Completion rate" value={`${Math.round(partner.completionRate)}%`} />
              <StatCard icon={<CalendarClock className="h-5 w-5" />} label="Reviews" value={partner.totalReviews} />
            </div>
          )}

          {/* Manage — also reachable from the sidebar on desktop; kept here too so mobile (no sidebar) always has a way in */}
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mb-3">Manage your work</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ManageCard icon={<Briefcase className="h-5 w-5" />} title="Bookings" onClick={() => openSubView("bookings")} locked={!isApproved} />
              <ManageCard icon={<CalendarClock className="h-5 w-5" />} title="Availability & slots" onClick={() => openSubView("availability")} locked={!isApproved} />
              {partner.type === "BUSINESS" && (
                <ManageCard icon={<Users className="h-5 w-5" />} title="Team" onClick={() => openSubView("team")} locked={!isApproved} />
              )}
              <ManageCard icon={<Landmark className="h-5 w-5" />} title="Bank account" onClick={() => openSubView("bank")} locked={!isApproved} />
              <ManageCard icon={<GraduationCap className="h-5 w-5" />} title="Training" onClick={() => openSubView("training")} />
            </div>
          </div>
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
        onNavigateTab={goToTab}
        onOpenSubView={openSubView}
        onLogout={onLogout}
      />
      <div className="flex-1 min-w-0">{content}</div>
      {subView === null && <BottomNav active={activeTab} onNavigate={goToTab} />}

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
