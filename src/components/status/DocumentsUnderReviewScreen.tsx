"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Clock3, GraduationCap, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as trainingApi from "@/lib/api/training";
import type { PartnerTrainingProgress } from "@/lib/api/types";

/** Submitted -> under review -> approved, mirroring the actual status
 *  machine (KYC_SUBMITTED sits between PENDING_KYC and TRAINING) rather
 *  than being purely decorative — "Under review" is the one genuinely
 *  active step, hence the pulsing dot (same motif as TodayActivity's
 *  "Live now" indicator). */
function ReviewProgressTracker() {
  return (
    <div className="flex items-start w-full max-w-[280px] mx-auto mb-7">
      <div className="flex flex-col items-center gap-1.5 w-16 shrink-0">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="text-[10px] font-bold text-green-600 text-center leading-tight">Submitted</span>
      </div>
      <div className="flex-1 h-0.5 bg-green-500 mt-1.5" />
      <div className="flex flex-col items-center gap-1.5 w-16 shrink-0">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9851A] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C9851A]" />
        </span>
        <span className="text-[10px] font-bold text-[#C9851A] text-center leading-tight">Under review</span>
      </div>
      <div className="flex-1 h-0.5 bg-stone-200 mt-1.5" />
      <div className="flex flex-col items-center gap-1.5 w-16 shrink-0">
        <div className="w-3 h-3 rounded-full bg-stone-200" />
        <span className="text-[10px] font-bold text-stone-400 text-center leading-tight">Approved</span>
      </div>
    </div>
  );
}

/**
 * status === KYC_SUBMITTED — documents are in, waiting on admin review.
 * Rather than a blank "please wait" screen, this previews the training
 * program that unlocks next (same GET /partner/training data TrainingCenter
 * uses) so there's something concrete to look at — but strictly read-only
 * here: no lesson viewer, no mark-complete, no achievement toasts. That
 * machinery only makes sense once training is actually reachable
 * (partner.status === "TRAINING"), which is why this is its own small
 * component instead of TrainingCenter with a "disabled" flag bolted on.
 */
export default function DocumentsUnderReviewScreen() {
  const { refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<PartnerTrainingProgress[] | null>(null);

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
    <div className="flex flex-col flex-1 min-h-0 bg-white animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex flex-col items-center text-center px-6 pt-10 pb-2 shrink-0">
        <div className="w-16 h-16 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-5">
          <Clock3 className="h-7 w-7 text-[#C9851A]" />
        </div>
        <h1 className="text-xl font-extrabold text-stone-900 mb-2">Documents under review</h1>
        <p className="text-sm text-stone-500 leading-relaxed max-w-xs mb-1">
          We&apos;re verifying your documents. This usually takes 1-2 business days — check back soon.
        </p>
      </div>

      <div className="px-6">
        <ReviewProgressTracker />
      </div>

      <div className="flex justify-center px-6 mb-7 shrink-0">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-2xl border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh status
        </button>
      </div>

      {/* Training preview — read-only, dimmed, no click handlers at all */}
      <div className="px-5">
        <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-700">Up next: training</p>
              <p className="text-[11px] text-stone-400">Unlocks once your documents are verified</p>
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
                <div
                  key={progress.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-3.5 py-3"
                >
                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-stone-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-700 truncate">{progress.course.title}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
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

      <div className="flex-1 flex items-end justify-center py-6 shrink-0">
        <button
          onClick={() => logout()}
          className="text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
