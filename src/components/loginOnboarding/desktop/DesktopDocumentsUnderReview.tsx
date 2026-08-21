"use client";

import React, { useEffect, useState } from "react";
import { Clock3, GraduationCap, Lock, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as trainingApi from "@/lib/api/training";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";
import type { PartnerTrainingProgress } from "@/lib/api/types";

/** Submitted -> under review -> approved — same 3-step tracker as the
 *  mobile DocumentsUnderReviewScreen (that file is left untouched; this is
 *  a small, deliberate duplication rather than an extraction, since this
 *  desktop version's spacing/sizing genuinely differs and mobile isn't
 *  meant to change at all here). */
function ReviewProgressTracker() {
  return (
    <div className="flex items-start w-full max-w-sm mx-auto mb-8">
      <div className="flex flex-col items-center gap-2 w-20 shrink-0">
        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-xs font-bold text-green-600">Submitted</span>
      </div>
      <div className="flex-1 h-0.5 bg-green-500 mt-2" />
      <div className="flex flex-col items-center gap-2 w-20 shrink-0">
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9851A] opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C9851A]" />
        </span>
        <span className="text-xs font-bold text-[#C9851A]">Under review</span>
      </div>
      <div className="flex-1 h-0.5 bg-stone-200 mt-2" />
      <div className="flex flex-col items-center gap-2 w-20 shrink-0">
        <div className="w-4 h-4 rounded-full bg-stone-200" />
        <span className="text-xs font-bold text-stone-400">Approved</span>
      </div>
    </div>
  );
}

/**
 * Desktop rendering of status === KYC_SUBMITTED — same wizard shell as the
 * rest of the flow (sidebar, "Grow with Eezit" card), but with the sidebar
 * reporting "Under review" on the Verify Identity step (see
 * OnboardingWizardContext's activeStepBadge) instead of a plain numbered
 * circle, and the top bar enabled (see OnboardingWizardShell's `topBar`
 * prop) since this is the one screen that's asked for it so far.
 *
 * There's deliberately no way back to earlier steps from here — see
 * OnboardingWizardShell's own note on why that's structural, not just a
 * missing button.
 */
export default function DesktopDocumentsUnderReview() {
  const { refreshProfile } = useAuth();
  const { setActiveStep, setActiveStepBadge } = useOnboardingWizardStep();
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<PartnerTrainingProgress[] | null>(null);

  useEffect(() => {
    setActiveStep("verify_identity");
    setActiveStepBadge("Under review");
    return () => setActiveStepBadge(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set once on mount, cleared once on unmount; re-running on every render would fight the cleanup
  }, []);

  useEffect(() => {
    trainingApi
      .getMyCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-stone-100 shadow-sm p-10">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-5">
          <Clock3 className="h-7 w-7 text-[#C9851A]" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 mb-2">Documents under review</h1>
        <p className="text-sm text-stone-500 leading-relaxed max-w-sm mb-2">
          We&apos;re verifying your documents. This usually takes 1-2 business days — check back soon.
        </p>
      </div>

      <ReviewProgressTracker />

      <div className="flex justify-center mb-8">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh status
        </button>
      </div>

      {/* Training preview — read-only, dimmed, no click handlers at all */}
      <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-700">Up next: training</p>
            <p className="text-xs text-stone-400">Unlocks once your documents are verified</p>
          </div>
        </div>

        {courses === null ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="text-xs text-stone-400 text-center py-4">
            Your training courses will appear here once you&apos;re verified.
          </p>
        ) : (
          <div className="space-y-2 opacity-60 pointer-events-none select-none">
            {courses.map((progress) => (
              <div key={progress.id} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-stone-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-700 truncate">{progress.course.title}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {progress.course.estimatedMinutes} min
                    {progress.course.isMandatory ? " · Mandatory" : " · Optional"}
                  </p>
                </div>
                <Lock className="h-3.5 w-3.5 text-stone-300 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
