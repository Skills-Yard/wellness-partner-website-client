"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onForegroundPushMessage } from "@/lib/firebase/messaging";
import { syncPushTokenSilently } from "@/lib/notifications/push";
import { queryKeys } from "./queries/queryKeys";
import type { IncomingBroadcast } from "@/lib/api/types";

const TOAST_LIFETIME_MS = 6000;

export type ForegroundPushToast = {
  id: string;
  title: string;
  body: string;
};

/** Mounted once for the whole app (see PushNotificationBootstrap) while a
 *  partner is logged in:
 *  1. On enable, silently re-registers the FCM token if permission was
 *     already granted on an earlier visit — no prompt, covers token
 *     rotation for a returning partner.
 *  2. Wires a push that arrives while the tab is focused (the service
 *     worker never sees these) to refresh the bell's list/badge live.
 *  3. For a push carrying a `bookingId` — the shape both the FCFS on-demand
 *     broadcast and the informational booking-lifecycle pushes use —
 *     invalidates the incoming-broadcasts query first (see
 *     useIncomingBroadcasts) so IncomingBookingModal has first refusal: an
 *     offer still PENDING there gets the big Accept/Decline popup instead
 *     of also being queued as a toast. Everything else (booking confirmed,
 *     assigned, KYC/approval updates, ...) becomes a dismissible toast — the
 *     OS notification raised alongside it (see messaging.ts) is at the
 *     mercy of things this app can't control (Do Not Disturb, a browser
 *     muting its own focused tab), so the in-app toast is the one signal
 *     guaranteed visible while the tab is open. */
export function usePushRegistration(enabled: boolean) {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ForegroundPushToast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (enabled) void syncPushTokenSilently();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    onForegroundPushMessage(async (title, body, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount() });

      const bookingId = data.bookingId;
      if (bookingId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.incomingBroadcasts() });
        const broadcasts = queryClient.getQueryData<IncomingBroadcast[]>(
          queryKeys.incomingBroadcasts(),
        );
        const isPendingOffer = broadcasts?.some(
          (b) => b.bookingId === bookingId && b.response === "PENDING",
        );
        // IncomingBookingModal already owns this one — skip the toast so it
        // isn't shown twice.
        if (isPendingOffer) return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((current) => [...current, { id, title, body }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), TOAST_LIFETIME_MS),
      );
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled, queryClient, dismissToast]);

  // Belt-and-braces: clears any still-pending auto-dismiss timers on unmount
  // (e.g. logout tearing down the bootstrap) so they don't fire setState
  // against an unmounted component.
  useEffect(() => {
    const timersAtMount = timers.current;
    return () => {
      timersAtMount.forEach(clearTimeout);
      timersAtMount.clear();
    };
  }, []);

  return { toasts, dismissToast };
}
