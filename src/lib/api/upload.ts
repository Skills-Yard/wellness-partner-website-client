import { getKycUploadUrl } from "./kyc";
import { getEmployeeKycUploadUrl } from "./employees";
import { ApiError } from "./client";

/**
 * Presign -> PUT -> return the r2Key to submit later. One helper shared by
 * owner KYC, business KYC, and employee KYC forms — only the presign call
 * differs (self vs a specific employee), so it's injected.
 */
async function uploadViaPresign(
  file: File,
  getUploadUrl: (fileName: string, contentType: string) => Promise<{ uploadUrl: string; r2Key: string }>
): Promise<string> {
  const { uploadUrl, r2Key } = await getUploadUrl(file.name, file.type || "application/octet-stream");

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    throw new ApiError("File upload to storage failed. Please try again.", "UPLOAD_FAILED", putRes.status);
  }

  return r2Key;
}

export function uploadKycFile(file: File) {
  return uploadViaPresign(file, getKycUploadUrl);
}

export function uploadEmployeeKycFile(employeeId: string, file: File) {
  return uploadViaPresign(file, (fileName, contentType) =>
    getEmployeeKycUploadUrl(employeeId, fileName, contentType)
  );
}
