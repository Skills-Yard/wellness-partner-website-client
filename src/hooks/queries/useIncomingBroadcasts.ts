"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncomingBroadcasts } from "@/lib/api/bookings";
import { queryKeys } from "./queryKeys";

/**
 * Pending on-demand booking offers broadcast to this partner — feeds
 * IncomingBookingModal's Accept/Decline popup.
 *
 * No fixed-interval polling: an offer arriving is covered by both a push
 * notification (see usePushRegistration) and the realtime socket's
 * booking:offer event (see usePartnerRealtimeConnection), and an offer
 * *disappearing* — someone else won it, or the search timed out — is now
 * covered by booking:offer-closed, which used to be the one thing only an
 * on-screen poll could catch. refetchOnWindowFocus stays as the one
 * remaining non-push-driven refresh, for a tab that was backgrounded long
 * enough to miss its socket/push events entirely.
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
    refetchOnWindowFocus: true,
  });
}
