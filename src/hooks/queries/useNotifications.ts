"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import { getAccessToken } from "@/lib/api/client";
import { queryKeys } from "./queryKeys";

/** Recent notifications for the logged-in partner. Disabled entirely for a
 *  logged-out visitor.
 *
 *  Keeps `data` as the plain notification array (existing callers destructure
 *  `data: notifications = []` and never touched this shape), but also
 *  surfaces `pagination`/`counts` from the backend's `{ data, pagination,
 *  counts: { unread, read } }` envelope now that getNotifications() returns
 *  the full thing instead of just `.data`.
 *
 *  `isRead` is forwarded straight to the backend filter (NotificationsSidebar's
 *  All/Unread tabs) — appended as its own query-key segment so each filter
 *  gets its own cache entry, but `queryKeys.notifications()` itself stays
 *  bare so every existing `invalidateQueries({ queryKey: queryKeys.notifications() })`
 *  call still busts every filter's cache at once (React Query prefix-matches
 *  by default). `counts` in the response is the same aggregate regardless of
 *  `isRead` (see the backend's paginateWithCounts()), so callers can read
 *  both tab totals off of whichever filter happens to be active. */
export function useNotifications(take = 20, isRead?: boolean) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  const query = useQuery({
    queryKey: [...queryKeys.notifications(), { take, isRead }],
    queryFn: () => notificationsApi.getNotifications({ take, isRead }),
    enabled: !!accessToken,
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    data: query.data?.data ?? [],
    pagination: query.data?.pagination,
    counts: query.data?.counts,
  };
}

/** Drives the bell's unread badge. Polls on a slow interval so the badge
 *  eventually reflects a push received in another tab without the partner
 *  having to do anything — the fast path is still the real-time foreground
 *  push handler updating the cache directly (see usePushRegistration). */
export function useUnreadNotificationCount() {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  return useQuery({
    queryKey: queryKeys.unreadNotificationCount(),
    queryFn: () => notificationsApi.getUnreadNotificationCount().then((r) => r.count),
    enabled: !!accessToken,
    staleTime: 20 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount() });
    },
  });
}
