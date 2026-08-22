"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface PaginatedListPage<T> {
  data: T[] | null | undefined;
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * Generalizes NotificationsPanel's "Load more" pattern (see
 * useNotifications.ts + NotificationsPanel.tsx) into a reusable hook, built
 * on react-query's useInfiniteQuery so page accumulation/caching/race
 * conditions are handled by the library instead of hand-rolled state.
 * Unlike notifications (whose endpoint has no real total, so that screen
 * approximates "more available" from length vs requested count), every
 * endpoint this hook is meant for returns a real `pagination.totalPages` —
 * `hasMore` is exact, not a heuristic.
 *
 * `queryKey` should already include every filter/search param that affects
 * the result set (e.g. `["bookings", status, q]`) — changing it is a normal
 * react-query key change, which resets back to page 1 on its own.
 */
export function usePaginatedList<T>(
  queryKey: readonly unknown[],
  fetchPage: (page: number, limit: number) => Promise<PaginatedListPage<T>>,
  options?: { limit?: number; enabled?: boolean }
) {
  const limit = options?.limit ?? 20;

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    enabled: options?.enabled,
  });

  const items = query.data?.pages.flatMap((page) => page.data ?? []) ?? [];
  const total = query.data?.pages[0]?.pagination?.total;

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    error: query.error,
    refetch: query.refetch,
  };
}
