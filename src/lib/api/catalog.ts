import { request } from "./client";
import type { ServiceItem } from "./types";

// Public endpoint (no auth guard on the backend controller) — safe to call
// before/without a partner session, e.g. while picking services at signup.
// FLEXIBLE location mode means it degrades to a global fallback zone rather
// than erroring when no x-zone-id/geo context is available.
export function getServiceItems() {
  return request<ServiceItem[]>("/catalog/service-items", { auth: false });
}
