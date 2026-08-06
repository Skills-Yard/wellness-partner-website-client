import { request } from "./client";
import type { BusinessEntityType, PartnerKyc } from "./types";

export function getKyc() {
  return request<PartnerKyc>("/partner/kyc");
}

export function getKycUploadUrl(fileName: string, contentType: string) {
  return request<{ uploadUrl: string; r2Key: string }>("/partner/kyc/upload-url", {
    method: "POST",
    body: { fileName, contentType },
  });
}

export interface SubmitKycPayload {
  aadhaarNumber?: string;
  aadhaarFrontKey?: string;
  aadhaarBackKey?: string;
  panNumber?: string;
  panKey?: string;
  selfieKey?: string;
  certificateKeys?: string[];
  videoKycKey?: string;
  videoKycDurationSec?: number;
  // Business-only
  businessName?: string;
  businessType?: BusinessEntityType;
  gstin?: string;
  businessRegistrationNumber?: string;
  businessAddress?: string;
  businessLicenseKey?: string;
  businessPanNumber?: string;
  businessPanKey?: string;
  cancelledChequeKey?: string;
}

export function submitKyc(data: SubmitKycPayload) {
  return request<PartnerKyc>("/partner/kyc/submit", {
    method: "POST",
    body: data,
  });
}
