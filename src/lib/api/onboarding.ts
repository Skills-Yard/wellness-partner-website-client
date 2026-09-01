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

// Server-side equivalent of setServices() where the caller only knows which
// ServiceCategories the partner picked: the backend expands categoryIds into
// every active ServiceItem beneath them. Preferred over resolving the catalog
// on the client just to flatten categories -> items.
export function setServicesByCategory(categoryIds: string[]) {
  return request<PartnerService[]>("/partner/onboarding/services/by-category", {
    method: "POST",
    body: { categoryIds },
  });
}

export function updateOnboardingStep(step: number) {
  return request("/partner/onboarding/step", {
    method: "PATCH",
    body: { step },
  });
}
