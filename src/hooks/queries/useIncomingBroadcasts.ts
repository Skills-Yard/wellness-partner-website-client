"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncomingBroadcasts } from "@/lib/api/bookings";
import { queryKeys } from "./queryKeys";

const POLL_INTERVAL_MS = 15 * 1000;

/**
 * Pending on-demand booking offers broadcast to this partner — feeds
 * IncomingBookingModal's Accept/Decline popup. Polled on a short interval
 * (independent of any push) so the popup still appears if a push was
 * missed — tab was backgrounded/closed when it arrived, browser throttled
 * it, permission was never granted, etc. — and refetches on focus so
 * returning to the tab surfaces a new offer immediately rather than waiting
 * out the interval. A foreground push additionally triggers an immediate
 * invalidation of this query (see usePushRegistration) so the popup usually
 * appears well before the next poll tick.
 *
 * Only meaningful for an approved, logged-in partner — broadcasts are never
 * sent to anyone else — so callers gate `enabled` on that.
 */
export function useIncomingBroadcasts(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.incomingBroadcasts(),
    queryFn: getIncomingBroadcasts,
    enabled,
    staleTime: 5 * 1000,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
  });
}
