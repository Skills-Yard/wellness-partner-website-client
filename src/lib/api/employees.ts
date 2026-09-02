import { request, requestEnvelope, fetchAllPaginated } from "./client";
import type {
  EmployeeTrainingProgress,
  PartnerEmployee,
  PartnerKyc,
  TrainingStatus,
} from "./types";

export function getEmployees() {
  return fetchAllPaginated<PartnerEmployee>((page, limit) => `/partner/employees?page=${page}&limit=${limit}`);
}

// Single-page variant for usePaginatedList-backed screens (TeamPanel).
export function getEmployeesPage(page: number, limit: number) {
  return requestEnvelope<PartnerEmployee[]>(`/partner/employees?page=${page}&limit=${limit}`);
}

export function createEmployee(data: {
  name: string;
  phone: string;
  role: string;
  profilePhotoKey?: string;
  specializations?: string[];
}) {
  return request<PartnerEmployee>("/partner/employees", {
    method: "POST",
    body: data,
  });
}

export function updateEmployee(
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    role: string;
    profilePhotoKey: string;
    specializations: string[];
    isActive: boolean;
  }>
) {
  return request<PartnerEmployee>(`/partner/employees/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export function removeEmployee(id: string) {
  return request(`/partner/employees/${id}`, { method: "DELETE" });
}

// 404s when the employee has no KYC on file yet — callers treat a thrown
// ApiError as "not submitted" rather than a hard failure.
export function getEmployeeKyc(id: string) {
  return request<PartnerKyc>(`/partner/employees/${id}/kyc`);
}

export interface SubmitEmployeeKycPayload {
  aadhaarNumber?: string;
  aadhaarFrontKey?: string;
  aadhaarBackKey?: string;
  panNumber?: string;
  panKey?: string;
  selfieKey?: string;
  certificateKeys?: string[];
  videoKycKey?: string;
  videoKycDurationSec?: number;
}

export function submitEmployeeKyc(id: string, data: SubmitEmployeeKycPayload) {
  return request<PartnerKyc>(`/partner/employees/${id}/kyc`, {
    method: "POST",
    body: data,
  });
}

export function getEmployeeKycUploadUrl(id: string, fileName: string, contentType: string) {
  return request<{ uploadUrl: string; r2Key: string }>(`/partner/employees/${id}/kyc/upload-url`, {
    method: "POST",
    body: { fileName, contentType },
  });
}

// ---- Employee training (owner-proxy) ----
// The owning business completes an employee's post-KYC training here, or
// shares the tokenised link below for the employee to do it themselves.

export interface EmployeeTrainingResponse {
  employee: { id: string; name: string; status: string };
  courses: EmployeeTrainingProgress[];
}

export function getEmployeeTraining(id: string) {
  return request<EmployeeTrainingResponse>(`/partner/employees/${id}/training`);
}

export function updateEmployeeCourseStatus(
  id: string,
  courseId: string,
  status: TrainingStatus,
  score?: number
) {
  return request<EmployeeTrainingProgress>(
    `/partner/employees/${id}/training/${courseId}/status`,
    { method: "PATCH", body: { status, score } }
  );
}

// Owner-proxy: mark one lesson of an employee's assigned course complete.
// Same server-side roll-up as the partner/token endpoints (course
// auto-completes + employee auto-approves once its last lesson lands).
export function markEmployeeLesson(id: string, courseId: string, lessonId: string) {
  return request<EmployeeTrainingProgress>(
    `/partner/employees/${id}/training/${courseId}/lessons/${lessonId}`,
    { method: "PATCH" }
  );
}

export function createEmployeeTrainingLink(id: string) {
  return request<{ token: string; url: string; expiresAt: string }>(
    `/partner/employees/${id}/training/share-link`,
    { method: "POST" }
  );
}
