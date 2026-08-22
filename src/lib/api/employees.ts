import { request, requestEnvelope, fetchAllPaginated } from "./client";
import type { PartnerEmployee } from "./types";

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

export function getEmployeeKyc(id: string) {
  return request(`/partner/employees/${id}/kyc`);
}

export function submitEmployeeKyc(
  id: string,
  data: {
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
) {
  return request(`/partner/employees/${id}/kyc`, {
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
