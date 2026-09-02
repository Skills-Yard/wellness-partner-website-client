import { request, fetchAllPaginated } from "./client";
import type { PartnerTrainingProgress, TrainingStatus } from "./types";

// Returns every course assigned to this partner, each with its modules and
// lessons already nested (course.modules[].lessons[]) — no separate
// fetch-per-module/fetch-per-lesson round trip needed. The list itself is
// paginated backend-side now (20/page default), so this walks every page.
//
// Deliberately kept as "fetch everything" rather than converted to
// usePaginatedList's incremental Load-more pattern: TrainingCenter.tsx's
// mandatory-course gating (mandatory/remaining/mandatoryDone, which blocks
// partner approval) needs the partner's COMPLETE course list to compute
// correctly — a partially-loaded page could show "all mandatory training
// done" before a later page's still-incomplete mandatory course ever loads.
// Course catalogs are also admin-curated and bounded (tens of items per
// partner type, not a growing log), so there's no real perf cost to paying
// for the small number of extra page round trips here.
export function getMyCourses() {
  return fetchAllPaginated<PartnerTrainingProgress>(
    (page, limit) => `/partner/training?page=${page}&limit=${limit}`
  );
}

export function updateMyCourseStatus(courseId: string, status: TrainingStatus, score?: number) {
  return request<PartnerTrainingProgress>(`/partner/training/${courseId}/status`, {
    method: "PATCH",
    body: { status, score },
  });
}

// Mark one lesson of an assigned course complete. Idempotent server-side (a
// re-watch no-ops). The backend rolls the completion up the tree: it records
// the parent module as done once its last lesson lands, and auto-completes
// the whole course (status -> COMPLETED, score = course.passingScore, then
// the TRAINING -> PENDING_APPROVAL check) once the last lesson does. Returns
// the recomputed progress row for that course, in the same shape as
// getMyCourses — swap it straight into local state, no refetch needed.
export function markLessonComplete(courseId: string, lessonId: string) {
  return request<PartnerTrainingProgress>(
    `/partner/training/${courseId}/lessons/${lessonId}`,
    { method: "PATCH" }
  );
}
