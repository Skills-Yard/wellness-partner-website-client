"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "@/lib/api/notifications";
import { getAccessToken } from "@/lib/api/client";
import { queryKeys } from "./queryKeys";

/** Recent notifications for the logged-in partner. Disabled entirely for a
 *  logged-out visitor. */
export function useNotifications(take = 20) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => notificationsApi.getNotifications({ take }),
    enabled: !!accessToken,
    staleTime: 30 * 1000,
  });
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
