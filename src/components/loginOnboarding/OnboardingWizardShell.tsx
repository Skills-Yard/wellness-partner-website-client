"use client";

import React, { useState } from "react";
import { Bell, Check, ChevronDown, LogOut, TrendingUp, Smartphone, Users, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { WIZARD_STEPS, useOnboardingWizardStep } from "./OnboardingWizardContext";

const REVIEW_BENEFITS = [
  { icon: Users, title: "Get more clients", desc: "Reach thousands of customers looking for services." },
  { icon: TrendingUp, title: "Grow your business", desc: "Manage bookings and grow your earnings." },
  { icon: ShieldCheck, title: "Trusted platform", desc: "We ensure safety, trust and quality for everyone." },
];

/** Small on-brand "grow your business" mark for the sidebar's promo card —
 *  plain inline icons, no image asset, matching the app's other inline-SVG
 *  marks (Sidebar's logo, AvailabilityPanel's CalendarClockMark). */
function GrowMark() {
  return (
    <div className="relative w-14 h-14 rounded-2xl bg-linear-to-tr from-[#C9851A] to-[#FFD580] flex items-center justify-center shadow-sm">
      <Smartphone className="h-6 w-6 text-white" />
      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-[#F0DDBF] flex items-center justify-center shadow-sm">
        <TrendingUp className="h-3.5 w-3.5 text-[#C9851A]" />
      </div>
    </div>
  );
}

/** Notification bell + user avatar/name — opt-in per screen (WizardTopBar
 *  prop below) rather than shown on every step, since only the "documents
 *  under review" screen has asked for it so far. The avatar's only real
 *  function today is a one-item "Sign out" menu — same action the sidebar
 *  footer already offers, just reachable from up here too. */
function WizardTopBar() {
  const { partner, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (partner?.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center justify-end gap-4 px-8 py-4 border-b border-stone-100 bg-white shrink-0">
      <button className="relative p-2 rounded-full hover:bg-stone-50 transition-colors cursor-pointer" aria-label="Notifications">
        <Bell className="h-5 w-5 text-stone-600" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#FDF3E7] text-[#C9851A] flex items-center justify-center text-xs font-extrabold shrink-0">
            {initials}
          </div>
          <span className="text-sm font-bold text-stone-800">{partner?.name ?? "Partner"}</span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-stone-100 bg-white shadow-lg py-1.5 z-20">
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 hover:text-red-500 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Desktop-only wizard chrome for the pre-approval flow (login/register ->
 * work & location -> partner details -> verify identity -> review &
 * submit) — a persistent left sidebar showing progress across all of it,
 * mirroring the dashboard's own Sidebar pattern. Mobile keeps the existing
 * OnboardingShell (full-screen single-column) untouched; see
 * useIsDesktopViewport for where that split happens.
 *
 * The sidebar's progress — and the review step's right-hand "Why partner
 * with Eezit?" panel — both come from OnboardingWizardContext rather than
 * dashboard.tsx's partner.status/onboardingStep directly: LoginForm,
 * ProfileSetupFlow and KycFlow are three separate components swapped in by
 * that status, each with its own internal phases (e.g. ProfileSetupFlow's
 * SERVICE_AREA vs PROFILE_SERVICES, or KycFlow's form vs review), and it's
 * that finer-grained phase both need — so each desktop step component
 * reports its own step id on mount/transition instead.
 *
 * Every sidebar row here is a plain <div>, never a button — there's
 * deliberately no way to click back into an earlier step from this nav.
 * The actual reason that holds is architectural, not just this markup:
 * dashboard.tsx renders LoginForm/ProfileSetupFlow/KycFlow purely off
 * partner.status, so even if a row were clickable there'd be nowhere for
 * it to navigate to — but keep it that way if this ever changes.
 */
export default function OnboardingWizardShell({
  children,
  topBar = false,
}: {
  children: React.ReactNode;
  /** Notification bell + account menu above the content — opt-in per screen, see WizardTopBar. */
  topBar?: boolean;
}) {
  const { activeStep, activeStepBadge } = useOnboardingWizardStep();
  const { status, logout } = useAuth();
  const activeIndex = WIZARD_STEPS.findIndex((s) => s.id === activeStep);
  const isReview = activeStep === "review";

  return (
    <div className="min-h-screen w-full flex bg-[#FAF9F6]">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-stone-100 bg-white flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-6 py-6 border-b border-stone-100">
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[#C9851A] to-[#FFD580] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                <path d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z" fill="white" />
              </svg>
            </div>
            <span className="font-extrabold text-stone-900 tracking-wide text-sm">EEZIT PARTNER</span>
          </div>

          <nav className="px-4 py-6 space-y-1">
            {WIZARD_STEPS.map((step, index) => {
              const isDone = index < activeIndex;
              const isActive = index === activeIndex;
              const badge = isActive ? activeStepBadge : null;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isActive ? "bg-[#FDF3E7]" : ""
                  }`}
                >
                  {badge ? (
                    // Same pulsing-dot motif as the review screen's own tracker —
                    // this step is "active" in the sense of "still in play", not a
                    // fresh step the partner is filling in right now.
                    <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#C9851A] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C9851A]" />
                    </span>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isDone || isActive ? "bg-[#C9851A] text-white" : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : index + 1}
                    </div>
                  )}
                  <span
                    className={`text-sm font-semibold truncate ${
                      isActive ? "text-[#C9851A]" : isDone ? "text-stone-700" : "text-stone-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {badge && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#C9851A] bg-white border border-[#F0DDBF] rounded-full px-2 py-0.5">
                      {badge}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-2xl bg-[#FFF8EC] border border-[#F5E3C6] p-4 flex flex-col items-center text-center gap-2.5">
            <GrowMark />
            <p className="text-xs font-extrabold text-stone-900">Grow with Eezit</p>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Join thousands of trusted partners and grow your business.
            </p>
          </div>

          {/* Only meaningful once there's a session to leave — phone/OTP/partner-type haven't created one yet */}
          {status === "authenticated" && (
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-stone-400 hover:bg-stone-50 hover:text-red-500 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        {topBar && <WizardTopBar />}
        <div className="flex-1 flex items-center justify-center py-10 px-8 overflow-y-auto">{children}</div>
      </div>

      {/* Review step's "Why partner with Eezit?" panel — nothing to show for the other steps */}
      {isReview && (
        <aside className="w-80 shrink-0 border-l border-stone-100 bg-white p-6 overflow-y-auto">
          <h3 className="text-sm font-extrabold text-stone-900 mb-5">Why partner with Eezit?</h3>
          <div className="space-y-5">
            {REVIEW_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-[#C9851A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-stone-900">{title}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center opacity-80">
            <Sparkles className="h-16 w-16 text-[#F0DDBF]" strokeWidth={1} />
          </div>
        </aside>
      )}
    </div>
  );
}
