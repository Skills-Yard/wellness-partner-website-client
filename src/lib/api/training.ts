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
