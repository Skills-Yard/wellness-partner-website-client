import { QueryClient } from "@tanstack/react-query";

/**
 * Shared defaults for every query in the app. A short staleTime plus no
 * automatic refocus/reconnect refetching keeps things predictable for the
 * mostly-static profile/booking data this dashboard reads — notification
 * and incoming-broadcast queries override these per-query where a more
 * "live" feel actually matters (see useNotifications/useIncomingBroadcasts).
 *
 * A factory, not a module-level singleton — instantiated once per app inside
 * Providers via useState so client state isn't shared across requests/renders.
 */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
