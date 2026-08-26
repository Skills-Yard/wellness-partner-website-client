"use client";

import { useQuery } from "@tanstack/react-query";
import * as bookingsApi from "@/lib/api/bookings";
import { getAccessToken } from "@/lib/api/client";
import { queryKeys } from "./queryKeys";

/**
 * Every COMPLETED booking the partner has, for the Money screen's
 * day/week/month earnings breakdown. There's no payout-summary endpoint on
 * the backend, so this walks the partner's full booking history (via
 * getBookings' fetchAllPaginated) once and lets the caller bucket it by
 * whatever period it's currently showing — same "give me everything, filter
 * client-side" contract BookingsPanel/TodayActivity already rely on.
 *
 * staleTime is generous: past earnings don't change once a booking is
 * COMPLETED, so there's nothing to poll for — a manual refetch (or the
 * default refetchOnWindowFocus) is enough to pick up a booking that
 * completed since the last load.
 */
export function useCompletedBookings() {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  return useQuery({
    queryKey: queryKeys.completedBookings(),
    queryFn: async () => {
      const all = await bookingsApi.getBookings();
      return all.filter((b) => b.status === "COMPLETED");
    },
    enabled: !!accessToken,
    staleTime: 60 * 1000,
  });
}
