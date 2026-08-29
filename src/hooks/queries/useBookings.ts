"use client";

import { useQuery } from "@tanstack/react-query";
import { getBookingsPage } from "@/lib/api/bookings";
import { getAccessToken } from "@/lib/api/client";
import { getScheduledDateTime, isBookingOverdue } from "@/lib/bookingSchedule";
import type { Booking, BookingStatus } from "@/lib/api/types";
import { queryKeys } from "./queryKeys";

// Every status a booking can end its life in — completed, cancelled from any
// side, or disputed. Anything not in this set is still "in flight" (offered,
// accepted, or actively being worked) and shouldn't count toward a
// completion rate one way or the other yet.
const CONCLUDED_STATUSES: BookingStatus[] = [
  "COMPLETED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_PARTNER",
  "CANCELLED_BY_ADMIN",
  "DISPUTED",
];

/**
 * Total bookings + completion rate, derived from the partner's real booking
 * history rather than trusted from the summary fields on the partner
 * profile — those come back as 0 regardless of actual booking history, so
 * PartnerHomescreen's stat cards compute the true numbers here instead.
 * averageRating/totalReviews have no equivalent client-side source (ratings
 * aren't part of the Booking shape at all) and still come straight from the
 * partner profile.
 *
 * Used to walk every page of GET /partner/bookings and reduce the whole,
 * ever-growing history client-side on every load — one request per ~100
 * bookings, just to count them. The backend now returns a `counts` bag (a
 * per-BookingStatus breakdown, computed server-side over this partner's
 * entire history) alongside any single page, so a `limit: 1` request is
 * enough to read `pagination.total` + `counts` and derive both numbers
 * without ever fetching the rows themselves.
 */
export function useBookingStats(enabled: boolean) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  const query = useQuery({
    queryKey: queryKeys.bookings(),
    queryFn: () => getBookingsPage(1, 1),
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000,
  });

  const total = query.data?.pagination?.total ?? 0;
  const counts = query.data?.counts ?? {};
  // A still-pending BROADCASTED offer was never this partner's booking (they
  // haven't accepted or declined it yet) — excluded from both counts below.
  const totalBookings = total - (counts.BROADCASTED ?? 0);
  const concluded = CONCLUDED_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  const completed = counts.COMPLETED ?? 0;

  return {
    isLoading: query.isLoading,
    totalBookings,
    completionRate: concluded === 0 ? 0 : (completed / concluded) * 100,
  };
}

// "Upcoming" isn't a single backend status — it's the confirmed/accepted jobs
// whose slot hasn't passed yet (BROADCASTED offers aren't the partner's until
// they accept; overdue ones are "missed", handled by TodayActivity). GET
// /partner/bookings filters one status at a time, so this pulls both and
// merges rather than over-fetching the whole list and filtering client-side.
const UPCOMING_STATUSES: BookingStatus[] = ["ACCEPTED", "CONFIRMED"];

/**
 * The partner's next few jobs, soonest first — feeds the Home dashboard's
 * "Upcoming bookings" card. Only meaningful for an approved partner (nobody
 * else has bookings), so callers gate `enabled`.
 */
export function useUpcomingBookings(enabled: boolean, limit = 5) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  const query = useQuery({
    queryKey: queryKeys.upcomingBookings(),
    queryFn: async () => {
      const pages = await Promise.all(
        UPCOMING_STATUSES.map((status) => getBookingsPage(1, 20, { status }))
      );
      return pages.flatMap((page) => page.data ?? []);
    },
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000,
  });

  const items = (query.data ?? [])
    .filter((b) => !isBookingOverdue(b))
    .sort((a, b) => getScheduledDateTime(a).getTime() - getScheduledDateTime(b).getTime())
    .slice(0, limit);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

/**
 * A page of the partner's most recent COMPLETED bookings — the raw material
 * the weekly earnings chart + "earnings this week" stat are derived from (see
 * lib/earnings.ts). One bounded request (100 rows, same ceiling TodayActivity
 * uses), not a full-history walk.
 */
export function useCompletedBookings(enabled: boolean) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  const query = useQuery({
    queryKey: queryKeys.completedBookings(),
    queryFn: () =>
      getBookingsPage(1, 100, { status: "COMPLETED" }).then((page): Booking[] => page.data ?? []),
    enabled: enabled && !!accessToken,
    staleTime: 60 * 1000,
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
