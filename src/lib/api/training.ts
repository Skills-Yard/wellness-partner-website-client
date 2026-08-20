import { request } from "./client";
import type { PartnerTrainingProgress, TrainingStatus } from "./types";

// Returns every course assigned to this partner, each with its modules and
// lessons already nested (course.modules[].lessons[]) — no separate
// fetch-per-module/fetch-per-lesson round trip needed.
export function getMyCourses() {
  return request<PartnerTrainingProgress[]>("/partner/training");
}

export function updateMyCourseStatus(courseId: string, status: TrainingStatus, score?: number) {
  return request<PartnerTrainingProgress>(`/partner/training/${courseId}/status`, {
    method: "PATCH",
    body: { status, score },
  });
}
