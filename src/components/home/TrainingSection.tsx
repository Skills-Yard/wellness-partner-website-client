"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, GraduationCap, Loader2, PlayCircle, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as trainingApi from "@/lib/api/training";
import { ApiError } from "@/lib/api/client";
import type { Partner, PartnerTrainingProgress, TrainingLesson, TrainingModule } from "@/lib/api/types";

function CourseLessons({ courseId }: { courseId: string }) {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, TrainingLesson[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mods = await trainingApi.getCourseModules(courseId);
        if (cancelled) return;
        setModules(mods);
        const lessonLists = await Promise.all(mods.map((m) => trainingApi.getModuleLessons(m.id)));
        if (cancelled) return;
        const map: Record<string, TrainingLesson[]> = {};
        mods.forEach((m, i) => (map[m.id] = lessonLists[i]));
        setLessonsByModule(map);
      } catch {
        // best-effort — course content is a nice-to-have, not a gate
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) return <p className="text-xs text-stone-400 py-3">Loading lessons…</p>;
  if (modules.length === 0) return <p className="text-xs text-stone-400 py-3">No lesson content added yet.</p>;

  return (
    <div className="space-y-3 py-2">
      {modules.map((m) => (
        <div key={m.id}>
          <p className="text-xs font-bold text-stone-700 mb-1">{m.title}</p>
          <div className="space-y-1.5">
            {(lessonsByModule[m.id] ?? []).map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-2 text-xs text-stone-500 pl-2">
                <PlayCircle className="h-3.5 w-3.5 text-stone-300 shrink-0" />
                <span>{lesson.title}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Lives inline on the dashboard's Home tab rather than as a separate
 * full-page step — shown whenever the partner isn't APPROVED yet
 * (PartnerHomescreen decides that), so training progress and the rest of
 * the (restricted) dashboard are visible together instead of hiding the
 * dashboard behind an isolated screen.
 */
export default function TrainingSection({ partner }: { partner: Partner }) {
  const { refreshProfile } = useAuth();
  const [courses, setCourses] = useState<PartnerTrainingProgress[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await trainingApi.getMyCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load your training courses.");
      setCourses([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render-loop hazard
    load();
  }, []);

  const handleComplete = async (courseId: string) => {
    setCompleting(courseId);
    setError(null);
    try {
      await trainingApi.updateMyCourseStatus(courseId, "COMPLETED", 100);
      await load();
      // Completing the last mandatory course flips the partner's status to
      // PENDING_APPROVAL server-side — refresh the session's partner record
      // so this section (and the rest of the dashboard's restrictions)
      // updates without needing a manual reload.
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your progress. Please try again.");
    } finally {
      setCompleting(null);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    setError(null);
    try {
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not refresh your status. Please try again.");
    } finally {
      setCheckingStatus(false);
    }
  };

  if (partner.status === "PENDING_APPROVAL") {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
          <Clock3 className="h-5 w-5 text-[#C9851A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">Pending final approval</p>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Your training is complete. Our team is doing a final review before you go live — bookings, availability
            and other tools unlock as soon as you&apos;re approved.
          </p>
        </div>
      </div>
    );
  }

  if (courses === null) {
    return (
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
      </div>
    );
  }

  const mandatory = courses.filter((c) => c.course.isMandatory);
  const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-[#C9851A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-stone-900">Complete your training</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {remaining > 0
              ? `${remaining} mandatory course${remaining > 1 ? "s" : ""} left before your account can be approved.`
              : "All mandatory training complete — waiting on final review."}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4">
        {courses.length === 0 && (
          <p className="text-sm text-stone-400 py-6 text-center">No courses assigned yet — check back soon.</p>
        )}
        <div className="space-y-2.5">
          {courses.map((progress) => {
            const isOpen = expanded === progress.courseId;
            const isDone = progress.status === "COMPLETED";
            return (
              <div key={progress.id} className="rounded-xl border border-stone-100 bg-[#FAF9F6] overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : progress.courseId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-stone-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{progress.course.title}</p>
                    <p className="text-[11px] text-stone-400">
                      {progress.course.estimatedMinutes} min
                      {progress.course.isMandatory ? " · Mandatory" : " · Optional"}
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-stone-500 mb-2">{progress.course.description}</p>
                    <CourseLessons courseId={progress.courseId} />
                    {!isDone && (
                      <button
                        onClick={() => handleComplete(progress.courseId)}
                        disabled={completing === progress.courseId}
                        className="mt-2 w-full rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {completing === progress.courseId && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Mark course as complete
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

        {mandatory.length > 0 && remaining === 0 && (
          <button
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {checkingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Check approval status
          </button>
        )}
      </div>
    </div>
  );
}
