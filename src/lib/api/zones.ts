import { request } from "./client";
import type { ZoneCoordinateResolution } from "./types";

// Public endpoint — safe to call before/without a partner session, while
// resolving a service area at signup from a coordinate (manual lat/lon entry
// or the browser's geolocation for now; a map-pin picker can replace the
// input later without touching this call).
export function resolveZoneFromCoordinates(latitude: number, longitude: number) {
  const qs = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
  return request<ZoneCoordinateResolution>(`/zones?${qs.toString()}`, { auth: false });
}
