"use client";

import React, { useState } from "react";
import { ChevronRight, CalendarClock, Briefcase, Users, Star, TrendingUp, Lock } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import HeroBanner from "./HeroBanner";
import ProfilePage from "./ProfilePage";
import MoneyPage from "./MoneyPage";
import TrainingSection from "./TrainingSection";
import BookingsPanel from "./panels/BookingsPanel";
import AvailabilityPanel from "./panels/AvailabilityPanel";
import TeamPanel from "./panels/TeamPanel";
import BankAccountPanel from "./panels/BankAccountPanel";
import type { Partner } from "@/lib/api/types";

interface PartnerHomescreenProps {
  partner: Partner;
  onLogout: () => void;
}

type SubView = "bookings" | "availability" | "team" | "bank" | null;

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
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");
  const [subView, setSubView] = useState<SubView>(null);

  const isApproved = partner.status === "APPROVED";

  // Manage cards route to a working panel only once the partner is fully
  // approved — before that (TRAINING/PENDING_APPROVAL) they're shown
  // locked rather than hidden, so the dashboard's shape doesn't change
  // out from under the partner the moment they're approved.
  const openSubView = (view: Exclude<SubView, null>) => {
    if (!isApproved) return;
    setSubView(view);
  };

  if (subView === "bookings") return <BookingsPanel onBack={() => setSubView(null)} />;
  if (subView === "availability") return <AvailabilityPanel partner={partner} onBack={() => setSubView(null)} />;
  if (subView === "team") return <TeamPanel onBack={() => setSubView(null)} />;
  if (subView === "bank") return <BankAccountPanel onBack={() => setSubView(null)} />;

  if (activeTab === "profile") {
    return (
      <ProfilePage
        partner={partner}
        onLogout={onLogout}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenBankAccount={() => openSubView("bank")}
      />
    );
  }

  if (activeTab === "money") {
    return <MoneyPage activeTab={activeTab} onNavigate={setActiveTab} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-0">
      <DesktopNav active={activeTab} onNavigate={setActiveTab} />
      <HeroBanner />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Welcome */}
        <div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-stone-900 leading-snug">
            Welcome{partner.name ? `, ${partner.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-sm text-stone-450 mt-1">
            {isApproved
              ? `You're live in ${partner.city ?? "your area"} as an approved Vellora partner.`
              : "Finish the steps below to get approved and start taking bookings."}
          </p>
        </div>

        {/* Training — only relevant (and only ever rendered here) pre-approval */}
        {!isApproved && <TrainingSection partner={partner} />}

        {/* Stats — meaningless before approval, so only shown once live */}
        {isApproved && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<Briefcase className="h-5 w-5" />} label="Total bookings" value={partner.totalBookings} />
            <StatCard icon={<Star className="h-5 w-5" />} label="Average rating" value={partner.averageRating.toFixed(1)} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Completion rate" value={`${Math.round(partner.completionRate)}%`} />
            <StatCard icon={<CalendarClock className="h-5 w-5" />} label="Reviews" value={partner.totalReviews} />
          </div>
        )}

        {/* Manage */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mb-3">Manage your work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ManageCard icon={<Briefcase className="h-5 w-5" />} title="Bookings" onClick={() => openSubView("bookings")} locked={!isApproved} />
            <ManageCard icon={<CalendarClock className="h-5 w-5" />} title="Availability & slots" onClick={() => openSubView("availability")} locked={!isApproved} />
            {partner.type === "BUSINESS" && (
              <ManageCard icon={<Users className="h-5 w-5" />} title="Team" onClick={() => openSubView("team")} locked={!isApproved} />
            )}
            <ManageCard icon={<span className="font-extrabold">₹</span>} title="Bank account" onClick={() => openSubView("bank")} locked={!isApproved} />
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
