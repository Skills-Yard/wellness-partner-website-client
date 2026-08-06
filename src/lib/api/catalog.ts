import { request } from "./client";
import type { ServiceCategory, ServiceItem } from "./types";

// Both public endpoints (no auth guard on the backend controllers) — safe to
// call before/without a partner session, e.g. while picking services at
// signup.

// The full, un-scoped category list — not used for the signup picker (that
// derives categories from a zone-scoped service-item fetch below, see
// getServiceItems), but kept for anywhere a global browse view is useful.
export function getCategories() {
  return request<ServiceCategory[]>("/catalog/categories", { auth: false });
}

// Zone-scoped: when zoneId is provided, only items with an active
// ZoneServiceItemConfig for that zone come back (see
// ServiceItemService.getServiceItems on the backend) — i.e. only what's
// actually operable in the partner's chosen service area. Without a zoneId
// this returns every active item globally, which is why the onboarding flow
// always resolves a zone first (see ServiceAreaStep) before calling this.
export function getServiceItems(zoneId?: string) {
  return request<ServiceItem[]>("/catalog/service-items", {
    auth: false,
    headers: zoneId ? { "x-zone-id": zoneId } : undefined,
  });
}
