import { request } from "./client";
import type { PartnerTrainingProgress, TrainingLesson, TrainingModule, TrainingStatus } from "./types";

export function getMyCourses() {
  return request<PartnerTrainingProgress[]>("/partner/training");
}

export function updateMyCourseStatus(courseId: string, status: TrainingStatus, score?: number) {
  return request<PartnerTrainingProgress>(`/partner/training/${courseId}/status`, {
    method: "PATCH",
    body: { status, score },
  });
}

export function getCourseModules(courseId: string) {
  return request<TrainingModule[]>(`/training/courses/${courseId}/modules`);
}

export function getModuleLessons(moduleId: string) {
  return request<TrainingLesson[]>(`/training/modules/${moduleId}/lessons`);
}
