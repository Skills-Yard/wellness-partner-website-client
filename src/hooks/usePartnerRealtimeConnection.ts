"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  connectPartnerSocket,
  disconnectPartnerSocket,
  onPartnerSocketEvent,
} from "@/lib/socket/partnerSocket";
import { queryKeys } from "./queries/queryKeys";

/** Mounted once for the whole app (see PartnerRealtimeBootstrap) while a
 *  partner is logged in — same no-status-gate treatment as
 *  usePushRegistration, so the connection is already warm by the time
 *  partner.status flips to APPROVED and job offers start arriving.
 *
 *  Both booking:offer and booking:offer-closed are handled identically:
 *  invalidate the incoming-broadcasts query and let the existing
 *  useIncomingBroadcasts/IncomingBookingModal machinery do the rest — an
 *  offer appears near-instantly instead of on the next poll tick, and
 *  disappears near-instantly if another partner wins it or the search times
 *  out, instead of waiting out the on-screen poll interval. */
export function usePartnerRealtimeConnection(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    connectPartnerSocket();

    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.incomingBroadcasts() });

    const unsubscribeOffer = onPartnerSocketEvent("booking:offer", refresh);
    const unsubscribeClosed = onPartnerSocketEvent("booking:offer-closed", refresh);

    return () => {
      unsubscribeOffer();
      unsubscribeClosed();
      disconnectPartnerSocket();
    };
  }, [enabled, queryClient]);
}
