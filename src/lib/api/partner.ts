import { request } from "./client";
import type { AuthTokens, BankAccount, Partner, PartnerType } from "./types";

export function registerPartner(
  signupToken: string,
  data: { countryCode: string; type: PartnerType }
) {
  return request<{ message: string; partner: { newUser: Partner } } & { tokens: AuthTokens }>(
    "/partner/profile/register",
    {
      method: "POST",
      auth: false,
      bearerOverride: signupToken,
      body: data,
    }
  );
}

export function getProfile() {
  return request<Partner>("/partner/profile");
}

export function updateProfile(data: Partial<{
  name: string;
  email: string;
  profilePhotoKey: string;
  bio: string;
  yearsOfExperience: number;
  languages: string[];
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  pincode: string;
  serviceRadiusKm: number;
  bufferMinutes: number;
  whatsappOptIn: boolean;
  isOnline: boolean;
}>) {
  return request<Partner>("/partner/profile", {
    method: "PATCH",
    body: data,
  });
}

export function getBankAccount() {
  return request<BankAccount>("/partner/profile/bank-account");
}

export function upsertBankAccount(data: {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType?: string;
}) {
  return request<BankAccount>("/partner/profile/bank-account", {
    method: "PUT",
    body: data,
  });
}
