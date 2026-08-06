import { request } from "./client";
import type { AuthTokens, RequestOtpResponse, VerifyOtpResponse } from "./types";

// Matches ClientIdentifier.PARTNER_APP on the backend (src/shared/enums/client-identifier.enum.ts).
// There's no separate "web partner portal" identifier — this value is what
// tells verifyOtp to resolve against the Partner table instead of User.
const PARTNER_CLIENT_ID = "uc_android_partner_app";

export function requestOtp(countryCode: string, phone: string) {
  return request<RequestOtpResponse>("/auth/otp/request", {
    method: "POST",
    auth: false,
    body: { countryCode, phone },
  });
}

export function verifyOtp(countryCode: string, phone: string, code: string) {
  return request<VerifyOtpResponse>("/auth/otp/verify", {
    method: "POST",
    auth: false,
    body: {
      countryCode,
      phone,
      code,
      clientId: PARTNER_CLIENT_ID,
      deviceType: "WEB",
    },
  });
}

export function refreshSession() {
  return request<AuthTokens>("/auth/refresh", {
    method: "POST",
    auth: false,
    body: {},
  });
}

export function logout() {
  return request<{ message: string }>("/auth/logout", {
    method: "POST",
    body: {},
  });
}
