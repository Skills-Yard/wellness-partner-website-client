"use client";

import { useQuery } from "@tanstack/react-query";
import { getIncomingBroadcasts } from "@/lib/api/bookings";
import { queryKeys } from "./queryKeys";
import type { IncomingBroadcast } from "@/lib/api/types";

/**
 * An offer is already on screen. Nothing pushes us when another partner wins
 * it or it times out, so this interval is the only way the modal learns the
 * job is gone — the one genuinely poll-shaped problem here.
 */
const POLL_OFFER_ON_SCREEN_MS = 10 * 1000;

/**
 * Push was never granted (or isn't supported), so polling is this partner's
 * only channel for learning an offer exists at all.
 */
const POLL_NO_PUSH_MS = 15 * 1000;

/**
 * Push is working, and a foreground push already invalidates this query
 * immediately (see usePushRegistration) while the backend escalates to SMS if
 * no device acknowledges. This interval is a pure safety net for the case
 * where push is silently broken despite permission being granted, so it can be
 * slow.
 */
const POLL_PUSH_HEALTHY_MS = 60 * 1000;

function pushPermissionGranted() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted";
}

/**
 * Pending on-demand booking offers broadcast to this partner — feeds
 * IncomingBookingModal's Accept/Decline popup.
 *
 * The interval adapts rather than running flat out, because the job it does
 * changes with context. A push now invalidates this query the moment an offer
 * arrives, so polling is no longer how a healthy client learns about new work;
 * what it still uniquely covers is (a) an offer *disappearing*, which has no
 * push to subscribe to, and (b) a partner whose push is denied or broken, for
 * whom nothing else will surface the offer while the tab stays focused —
 * refetchOnWindowFocus only fires on *regaining* focus.
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
    // Re-evaluated after every fetch, so a partner who grants permission
    // mid-session backs off without needing a reload.
    refetchInterval: (query) => {
      if (!enabled) return false;

      const hasPendingOffer = (query.state.data as IncomingBroadcast[] | undefined)?.some(
        (broadcast) => broadcast.response === "PENDING",
      );
      if (hasPendingOffer) return POLL_OFFER_ON_SCREEN_MS;

      return pushPermissionGranted() ? POLL_PUSH_HEALTHY_MS : POLL_NO_PUSH_MS;
    },
    refetchOnWindowFocus: true,
  });
}
