"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, PlayCircle } from "lucide-react";
import type { EmployeeTrainingProgress, TrainingLesson } from "@/lib/api/types";

/**
 * The employee-facing training checklist, shared by two callers:
 *  - the owning business, proxy-completing from the Team drawer
 *  - the employee themselves, on the tokenised /employee-training/[token] page
 *
 * Per-lesson completion is persisted server-side: `onLessonComplete` marks
 * one lesson, and the backend rolls the module/course completion up (course
 * auto-completes once its last lesson lands, which also auto-approves the
 * employee). The `completedLessonIds` Set is seeded from each course's
 * persisted `completedLessonIds` and kept in sync as the caller refreshes
 * the list. `readOnly` disables all the actions once the employee is
 * already approved. `onComplete` is still used for the manual
 * "mark course as complete" button on lesson-less courses.
 */
function LessonRow({
  lesson,
  completed,
  readOnly,
  onComplete,
}: {
  lesson: TrainingLesson;
  completed: boolean;
  readOnly: boolean;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(lesson.videoKey);

  return (
    <div className="rounded-xl border border-stone-100 bg-[#FAF9F6] overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left cursor-pointer"
      >
        {completed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5 text-stone-300 shrink-0" />
        )}
        <span className="flex-1 text-xs font-semibold text-stone-700 truncate">{lesson.title}</span>
        {lesson.videoDurationSec != null && (
          <span className="text-[10px] text-stone-400 shrink-0">
            {Math.round(lesson.videoDurationSec / 60)} min
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3">
          {hasVideo && !videoFailed ? (
            <video
              controls
              className="w-full rounded-lg bg-black aspect-video"
              src={lesson.videoKey ?? undefined}
              onEnded={() => !completed && !readOnly && onComplete()}
              onError={() => setVideoFailed(true)}
            />
          ) : lesson.content ? (
            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{lesson.content}</p>
          ) : (
            <p className="text-xs text-stone-400 italic">
              {videoFailed ? "This video couldn't be loaded." : "No content added for this lesson yet."}
            </p>
          )}

          {!completed && !readOnly && (!hasVideo || videoFailed) && (
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
  onToggle,
  completedLessonIds,
  onLessonComplete,
  onManualComplete,
  completing,
  readOnly,
}: {
  progress: EmployeeTrainingProgress;
  expanded: boolean;
  onToggle: () => void;
  completedLessonIds: Set<string>;
  onLessonComplete: (lessonId: string) => void;
  onManualComplete: () => void;
  completing: boolean;
  readOnly: boolean;
}) {
  const isDone = progress.status === "COMPLETED";
  const modules = progress.course.modules ?? [];
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const isModuleDone = (module: (typeof modules)[number]) => {
    const lessons = module.lessons ?? [];
    return lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id));
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer">
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
            {allLessons.length > 0 && ` · ${completedCount}/${allLessons.length} lessons`}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-5">
          <p className="text-xs text-stone-500 mb-3 leading-relaxed">{progress.course.description}</p>

          {modules.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">No lesson content added yet.</p>
          ) : (
            <div className="space-y-3">
              {modules.map((m) => (
                <div key={m.id}>
                  <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                    {isModuleDone(m) && <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                    {m.title}
                  </p>
                  <div className="space-y-1.5">
                    {(m.lessons ?? []).map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        completed={completedLessonIds.has(lesson.id)}
                        readOnly={readOnly}
                        onComplete={() => onLessonComplete(lesson.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isDone && !readOnly && allLessons.length === 0 && (
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

export default function EmployeeCourseChecklist({
  courses,
  readOnly = false,
  onComplete,
  onLessonComplete,
  onLessonWatched,
  onError,
}: {
  courses: EmployeeTrainingProgress[];
  readOnly?: boolean;
  // Manual "mark course as complete" button — only rendered for a course with
  // no lessons at all. Returns a promise so the card can show a spinner.
  onComplete: (courseId: string) => Promise<void>;
  // Persists one lesson as complete. The caller performs the API call and
  // refreshes `courses` (react-query invalidation, or setView) so the server
  // roll-up — module ticks, course auto-complete, employee auto-approve —
  // flows back in. Throwing rolls back the optimistic tick.
  onLessonComplete: (courseId: string, lessonId: string) => Promise<void>;
  // Optional: fired per lesson the first time it's watched, for a toast.
  onLessonWatched?: (lessonTitle: string) => void;
  // Optional: surfaced when a lesson mark fails (after the tick is rolled back).
  onError?: (message: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(courses[0]?.courseId ?? null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  // Lessons ticked this session but not yet reflected in the `courses` prop.
  // The visible set is server truth ∪ these; a failed mark drops its id here.
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const serverCompletedIds = useMemo(
    () => new Set(courses.flatMap((c) => c.completedLessonIds ?? [])),
    [courses]
  );
  const completedLessonIds = useMemo(() => {
    const next = new Set(serverCompletedIds);
    optimisticIds.forEach((id) => next.add(id));
    return next;
  }, [serverCompletedIds, optimisticIds]);

  const runComplete = async (courseId: string) => {
    setCompletingId(courseId);
    try {
      await onComplete(courseId);
    } finally {
      setCompletingId(null);
    }
  };

  const handleLessonComplete = async (courseId: string, lessonId: string, lessonTitle: string) => {
    if (completedLessonIds.has(lessonId) || readOnly) return;

    setOptimisticIds((prev) => new Set(prev).add(lessonId));
    onLessonWatched?.(lessonTitle);

    try {
      await onLessonComplete(courseId, lessonId);
    } catch (err) {
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
      onError?.(err instanceof Error ? err.message : "Could not save your progress. Please try again.");
    }
  };

  if (courses.length === 0) {
    return <p className="text-xs text-stone-400 py-4">No courses assigned yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {courses.map((progress) => (
        <CourseCard
          key={progress.id}
          progress={progress}
          expanded={expandedId === progress.courseId}
          onToggle={() => setExpandedId((p) => (p === progress.courseId ? null : progress.courseId))}
          completedLessonIds={completedLessonIds}
          onLessonComplete={(lessonId) => {
            const lesson = (progress.course.modules ?? [])
              .flatMap((m) => m.lessons ?? [])
              .find((l) => l.id === lessonId);
            handleLessonComplete(progress.courseId, lessonId, lesson?.title ?? progress.course.title);
          }}
          onManualComplete={() => runComplete(progress.courseId)}
          completing={completingId === progress.courseId}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
