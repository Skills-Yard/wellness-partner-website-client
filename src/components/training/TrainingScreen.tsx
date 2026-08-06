"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, GraduationCap, Loader2, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as trainingApi from "@/lib/api/training";
import { ApiError } from "@/lib/api/client";
import type { PartnerTrainingProgress, TrainingLesson, TrainingModule } from "@/lib/api/types";

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

export default function TrainingScreen() {
  const { logout } = useAuth();
  const [courses, setCourses] = useState<PartnerTrainingProgress[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your progress. Please try again.");
    } finally {
      setCompleting(null);
    }
  };

  if (courses === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  const mandatory = courses.filter((c) => c.course.isMandatory);
  const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
      <div className="px-5 pt-6 pb-3 shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-3">
          <GraduationCap className="h-6 w-6 text-[#C9851A]" />
        </div>
        <h1 className="text-xl font-extrabold text-stone-900 mb-1">Complete your training</h1>
        <p className="text-sm text-stone-500">
          {remaining > 0
            ? `${remaining} mandatory course${remaining > 1 ? "s" : ""} left before your account can be approved.`
            : "All mandatory training complete — waiting on final review."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {courses.length === 0 && (
          <p className="text-sm text-stone-400 py-8 text-center">
            No courses assigned yet — check back soon.
          </p>
        )}
        <div className="space-y-3">
          {courses.map((progress) => {
            const isOpen = expanded === progress.courseId;
            const isDone = progress.status === "COMPLETED";
            return (
              <div key={progress.id} className="rounded-2xl border border-stone-100 bg-[#FAF9F6] overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : progress.courseId)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
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

        {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="px-5 pb-6 pt-2 shrink-0 border-t border-stone-100">
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
