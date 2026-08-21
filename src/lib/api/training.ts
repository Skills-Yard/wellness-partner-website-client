import { request, fetchAllPaginated } from "./client";
import type { PartnerTrainingProgress, TrainingStatus } from "./types";

// Returns every course assigned to this partner, each with its modules and
// lessons already nested (course.modules[].lessons[]) — no separate
// fetch-per-module/fetch-per-lesson round trip needed. The list itself is
// paginated backend-side now (20/page default), so this walks every page.
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
