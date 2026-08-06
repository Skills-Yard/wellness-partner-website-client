import { request } from "./client";
import type { ServiceCategory, ServiceItem } from "./types";

// Both public endpoints (no auth guard on the backend controllers) — safe to
// call before/without a partner session, e.g. while picking services at
// signup.

// The list a partner picks from at signup ("what services do you offer?").
export function getCategories() {
  return request<ServiceCategory[]>("/catalog/categories", { auth: false });
}

// FLEXIBLE location mode means it degrades to a global fallback zone rather
// than erroring when no x-zone-id/geo context is available. Fetched
// alongside categories so a category selection can be expanded into the
// concrete ServiceItem ids the partner.services endpoint actually wants.
export function getServiceItems() {
  return request<ServiceItem[]>("/catalog/service-items", { auth: false });
}
