import { request } from "./client";
import type { ServiceableZone } from "./types";

// Public endpoint — safe to call before/without a partner session, while
// picking a service area at signup.
export function listZones() {
  return request<ServiceableZone[]>("/zones/list", { auth: false });
}
