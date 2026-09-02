"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, GraduationCap, Loader2, PlayCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as trainingApi from "@/lib/api/training";
import { ApiError } from "@/lib/api/client";
import { Shimmer } from "@/components/ui/shimmer";
import { AchievementToast, useAchievementToast } from "./AchievementToast";
import type { Partner, PartnerTrainingProgress, TrainingLesson } from "@/lib/api/types";

// Read by PartnerHomescreen on mount — set here right before the completion
// that finishes every mandatory course, since that same action calls
// refreshProfile(), which flips partner.status TRAINING -> PENDING_APPROVAL
// server-side and swaps this whole screen out for the real dashboard in the
// same tick. A sessionStorage flag survives that swap; component state
// inside this soon-to-unmount tree wouldn't.
export const TRAINING_JUST_COMPLETED_KEY = "eezit-partner-training-just-completed";

/**
 * One lesson row. A lesson only counts as done once it's actually been
 * watched through — a video lesson completes on the video's real `ended`
 * event (not just opening it), text-only/empty lessons need an explicit
 * "Mark as read" since there's nothing to auto-detect there.
 */
function LessonRow({
  lesson,
  completed,
  onComplete,
}: {
  lesson: TrainingLesson;
  completed: boolean;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(lesson.videoKey);

  return (
    <div className="rounded-xl border border-stone-100 bg-[#FAF9F6] overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer"
      >
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5 text-stone-300 shrink-0" />
        )}
        <span className="flex-1 text-xs font-semibold text-stone-700 truncate">{lesson.title}</span>
        {lesson.videoDurationSec != null && (
          <span className="text-[10px] text-stone-400 shrink-0">{Math.round(lesson.videoDurationSec / 60)} min</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 animate-expand origin-top">
          {hasVideo && !videoFailed ? (
            <video
              controls
              className="w-full rounded-lg bg-black aspect-video"
              src={lesson.videoKey ?? undefined}
              onEnded={() => !completed && onComplete()}
              onError={() => setVideoFailed(true)}
            />
          ) : lesson.content ? (
            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{lesson.content}</p>
          ) : (
            <p className="text-xs text-stone-400 italic">
              {videoFailed ? "This video couldn't be loaded." : "No content added for this lesson yet."}
            </p>
          )}

          {/* Nothing to auto-detect "watched" from (no video, or the video failed to load) —
              an explicit action instead, so the lesson isn't permanently stuck unfinished. */}
          {!completed && (!hasVideo || videoFailed) && (
            <button
              onClick={onComplete}
              className="mt-2.5 w-full rounded-lg py-2 text-[11px] font-bold bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-all cursor-pointer"
            >
              Mark as {hasVideo ? "watched" : "read"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CourseCard({
  progress,
  expanded,
  onToggleExpand,
  completedLessonIds,
  onLessonComplete,
  onManualComplete,
  completing,
}: {
  progress: PartnerTrainingProgress;
  expanded: boolean;
  onToggleExpand: () => void;
  completedLessonIds: Set<string>;
  onLessonComplete: (lessonId: string) => void;
  onManualComplete: () => void;
  completing: boolean;
}) {
  const isDone = progress.status === "COMPLETED";
  const modules = progress.course.modules ?? [];
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  // A module is "done" once every one of its lessons is — mirror the same
  // client-side derivation the server uses, so the tick updates the instant
  // the last lesson in a module completes (rather than after a refetch).
  const isModuleDone = (module: (typeof modules)[number]) => {
    const lessons = module.lessons ?? [];
    return lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id));
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
      <button onClick={onToggleExpand} className="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left cursor-pointer">
        {isDone ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-stone-300 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-800 truncate">{progress.course.title}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {progress.course.estimatedMinutes} min
            {progress.course.isMandatory ? " · Mandatory" : " · Optional"}
            {allLessons.length > 0 && ` · ${completedCount}/${allLessons.length} lessons watched`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 animate-expand origin-top">
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">{progress.course.description}</p>

          {modules.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">No lesson content added yet.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div key={module.id}>
                  <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    {isModuleDone(module) && <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                    {module.title}
                  </p>
                  <div className="space-y-1.5">
                    {(module.lessons ?? []).map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        completed={completedLessonIds.has(lesson.id)}
                        onComplete={() => onLessonComplete(lesson.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Once every lesson is watched, the course completes itself — see
              handleLessonComplete. This manual fallback only matters for a
              course with no lessons at all, where there's nothing to
              auto-trigger from. */}
          {!isDone && allLessons.length === 0 && (
            <button
              onClick={onManualComplete}
              disabled={completing}
              className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {completing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Mark course as complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CourseListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Shimmer key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

/**
 * The one training UI, used two ways:
 *  - As the mandatory gate (no `onBack`) while partner.status === "TRAINING"
 *    — see TrainingGateScreen, which is all the partner can see until every
 *    mandatory course is done.
 *  - As a normal sidebar panel (`onBack` provided) once approved/pending, so
 *    training material stays available to rewatch — same component, same
 *    course list, just with a back arrow and no "you must finish this"
 *    framing.
 *
 * Completion is layered: finishing a lesson (video watched through, or
 * "mark as read" for one with no video) fires a small achievement toast and
 * checks whether it just finished every lesson in its course — if so, the
 * course itself is marked complete automatically (another toast). If that
 * was also the last mandatory course, the big TrainingCompleteModal takes
 * over on whichever screen renders next (see TRAINING_JUST_COMPLETED_KEY).
 */
export default function TrainingCenter({ partner, onBack }: { partner: Partner; onBack?: () => void }) {
  const { refreshProfile } = useAuth();
  const [courses, setCourses] = useState<PartnerTrainingProgress[] | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completingCourseId, setCompletingCourseId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { achievement, showAchievement } = useAchievementToast();

  const isGate = !onBack;

  const load = async () => {
    try {
      const data = await trainingApi.getMyCourses();
      setCourses(data);
      // Hydrate the lesson checklist from persisted progress so reloading the
      // page doesn't wipe every tick (this state used to be session-only).
      setCompletedLessonIds(new Set(data.flatMap((c) => c.completedLessonIds ?? [])));
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
    setCompletingCourseId(courseId);
    setError(null);
    try {
      await trainingApi.updateMyCourseStatus(courseId, "COMPLETED", 100);
      const freshCourses = await trainingApi.getMyCourses();
      setCourses(freshCourses);

      const completedCourse = freshCourses.find((c) => c.courseId === courseId);
      showAchievement("Course complete! 🎓", completedCourse?.course.title);

      const mandatory = freshCourses.filter((c) => c.course.isMandatory);
      const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;
      if (isGate && remaining === 0) {
        window.sessionStorage.setItem(TRAINING_JUST_COMPLETED_KEY, "true");
      }

      // Refresh either way — this is also what applies the TRAINING ->
      // PENDING_APPROVAL flip the line above just flagged for.
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update your progress. Please try again.");
    } finally {
      setCompletingCourseId(null);
    }
  };

  const handleLessonComplete = async (courseId: string, lessonId: string, lessonTitle: string) => {
    if (completedLessonIds.has(lessonId)) return; // already counted — a re-watch shouldn't re-fire the toast

    // Optimistic tick — the video's `ended` event fires once, so reflect it
    // immediately and roll back only if the server call fails.
    setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
    showAchievement("Lesson complete!", lessonTitle);
    setError(null);

    const wasDone = courses?.find((c) => c.courseId === courseId)?.status === "COMPLETED";

    try {
      // The server records the lesson, rolls the module/course completion up,
      // and returns the recomputed course row — swap it straight in.
      const updated = await trainingApi.markLessonComplete(courseId, lessonId);

      const nextCourses = (courses ?? []).map((c) => (c.courseId === courseId ? updated : c));
      setCourses(nextCourses);
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        updated.completedLessonIds.forEach((id) => next.add(id));
        return next;
      });

      if (updated.status === "COMPLETED" && !wasDone) {
        showAchievement("Course complete! 🎓", updated.course.title);

        const mandatory = nextCourses.filter((c) => c.course.isMandatory);
        const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;
        if (isGate && remaining === 0) {
          window.sessionStorage.setItem(TRAINING_JUST_COMPLETED_KEY, "true");
        }
        // Applies the TRAINING -> PENDING_APPROVAL flip the server just made.
        await refreshProfile();
      }
    } catch (err) {
      setCompletedLessonIds((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
      setError(err instanceof ApiError ? err.message : "Could not save your progress. Please try again.");
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

  const mandatory = (courses ?? []).filter((c) => c.course.isMandatory);
  const remaining = mandatory.filter((c) => c.status !== "COMPLETED").length;
  const mandatoryDone = mandatory.length > 0 && remaining === 0;

  return (
    <div className="flex flex-col pb-16">
      {onBack && (
        <div className="px-5 pt-6 pb-2">
          <button
            onClick={onBack}
            className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-[#C9851A]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-stone-900">
              {isGate ? "Complete your training" : "Training"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5 leading-relaxed">
              {isGate
                ? mandatoryDone
                  ? "All mandatory training complete — waiting on final review."
                  : `${remaining} mandatory course${remaining === 1 ? "" : "s"} left before your account can be approved.`
                : "Rewatch any lesson, any time — your completed courses stay here."}
            </p>
          </div>
        </div>

        {/* Progress bar — only meaningful once there's at least one mandatory course to track */}
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

        {/* Still under final review — shown alongside the (now rewatchable) course list rather than hiding it */}
        {partner.status === "PENDING_APPROVAL" && (
          <div className="mb-6 rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-stone-900">Pending final approval</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Your training is complete. Our team is doing a final review before you go live — bookings,
                  availability and other tools unlock as soon as you&apos;re approved.
                </p>
              </div>
              <button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                {checkingStatus && <Loader2 className="h-3 w-3 animate-spin" />}
                Check now
              </button>
            </div>
          </div>
        )}

        {/* Course list */}
        {courses === null ? (
          <CourseListSkeleton />
        ) : courses.length === 0 ? (
          <p className="text-sm text-stone-400 py-8 text-center">No courses assigned yet — check back soon.</p>
        ) : (
          <div className="space-y-2.5">
            {courses.map((progress) => (
              <CourseCard
                key={progress.id}
                progress={progress}
                expanded={expandedCourseId === progress.courseId}
                onToggleExpand={() => setExpandedCourseId((prev) => (prev === progress.courseId ? null : progress.courseId))}
                completedLessonIds={completedLessonIds}
                onLessonComplete={(lessonId) => {
                  const lesson = (progress.course.modules ?? [])
                    .flatMap((m) => m.lessons ?? [])
                    .find((l) => l.id === lessonId);
                  handleLessonComplete(progress.courseId, lessonId, lesson?.title ?? progress.course.title);
                }}
                onManualComplete={() => handleComplete(progress.courseId)}
                completing={completingCourseId === progress.courseId}
              />
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

        {isGate && mandatoryDone && partner.status === "TRAINING" && (
          <button
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {checkingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Check approval status
          </button>
        )}
      </div>

      <AchievementToast achievement={achievement} />
    </div>
  );
}
