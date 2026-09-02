"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, GraduationCap, Loader2, PartyPopper } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  EmployeeTrainingView,
  getEmployeeTrainingByToken,
  markEmployeeLessonByToken,
  updateEmployeeTrainingByToken,
} from "@/lib/api/employeeTraining";
import EmployeeCourseChecklist from "@/components/training/EmployeeCourseChecklist";
import type { EmployeeTrainingProgress } from "@/lib/api/types";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#F9F6F0] flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}

export default function EmployeeTrainingPage() {
  const params = useParams();
  const token = Array.isArray(params?.token) ? params.token[0] : (params?.token as string);

  const [view, setView] = useState<EmployeeTrainingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setView(await getEmployeeTrainingByToken(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This training link is no longer valid.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount for a route driven entirely by its URL token, not a render-loop hazard
    load();
  }, [load]);

  const applyResult = (res: Awaited<ReturnType<typeof updateEmployeeTrainingByToken>>) => {
    setView((prev) =>
      prev ? { ...prev, courses: res.courses as EmployeeTrainingProgress[], readOnly: res.readOnly } : prev
    );
    if (res.approved) setJustApproved(true);
  };

  const handleComplete = async (courseId: string) => {
    try {
      applyResult(await updateEmployeeTrainingByToken(token, courseId, "COMPLETED", 100));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your progress. Please try again.");
    }
  };

  // Lets EmployeeCourseChecklist roll back its optimistic tick on failure —
  // it catches, reverts, then calls onError.
  const handleLessonComplete = async (courseId: string, lessonId: string) => {
    applyResult(await markEmployeeLessonByToken(token, courseId, lessonId));
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      </Shell>
    );
  }

  if (error && !view) {
    return (
      <Shell>
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-base font-extrabold text-stone-900">Link unavailable</p>
          <p className="mt-2 text-sm text-stone-500">{error}</p>
          <p className="mt-4 text-xs text-stone-400">
            Ask your employer to send you a fresh training link.
          </p>
        </div>
      </Shell>
    );
  }

  if (!view) return null;

  const mandatory = view.courses.filter((c) => c.course.isMandatory);
  const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;
  const allDone = mandatory.length > 0 && remaining === 0;

  if (justApproved || (view.readOnly && allDone)) {
    return (
      <Shell>
        <div className="rounded-2xl border border-green-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <PartyPopper className="h-6 w-6" />
          </div>
          <p className="mt-3 text-lg font-extrabold text-stone-900">You&apos;re all set, {view.employee.name.split(" ")[0]}!</p>
          <p className="mt-2 text-sm text-stone-500">
            Your training is complete and your account is active. You can now be booked for services.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-[#C9851A]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-stone-900">
            {view.employee.name.split(" ")[0]}, complete your training
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5 leading-relaxed">
            {view.readOnly
              ? "Your completed courses — rewatch any lesson any time."
              : `${remaining} mandatory course${remaining === 1 ? "" : "s"} left. Finish them all and your account goes live automatically.`}
          </p>
        </div>
      </div>

      {mandatory.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-stone-700">Mandatory training</span>
            <span className="text-xs font-extrabold text-[#C9851A]">
              {mandatory.length - remaining}/{mandatory.length} done
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full bg-[#C9851A] rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((mandatory.length - remaining) / mandatory.length) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {view.readOnly && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
          <BadgeCheck className="h-4 w-4" /> Your account is active — this page is now read-only.
        </div>
      )}

      <EmployeeCourseChecklist
        courses={view.courses}
        readOnly={view.readOnly}
        onComplete={handleComplete}
        onLessonComplete={handleLessonComplete}
        onError={setError}
      />

      {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
    </Shell>
  );
}
