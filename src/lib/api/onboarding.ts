import { request } from "./client";
import type { PartnerService } from "./types";

export function getSelectedServices() {
  return request<PartnerService[]>("/partner/onboarding/services");
}

export function setServices(serviceItemIds: string[]) {
  return request<PartnerService[]>("/partner/onboarding/services", {
    method: "POST",
    body: { serviceItemIds },
  });
}

export function updateOnboardingStep(step: number) {
  return request("/partner/onboarding/step", {
    method: "PATCH",
    body: { step },
  });
}
