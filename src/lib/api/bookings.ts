import { fetchAllPaginated, request, requestEnvelope } from "./client";
import type { Booking, IncomingBroadcast, BookingStatus } from "./types";

export function getBookings() {
  return fetchAllPaginated<Booking>(
    (page, limit) => `/partner/bookings?page=${page}&limit=${limit}`,
  );
}

// Single-page fetch for usePaginatedList-backed screens (BookingsPanel) and
// useBookingStats (which only needs pagination.total + counts, not the
// rows) — forwards q/status/scheduledDate straight to the backend instead of
// walking every page and filtering a fully-fetched array client-side.
export function getBookingsPage(
  page: number,
  limit: number,
  filters?: { q?: string; status?: BookingStatus; scheduledDate?: string },
) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.q) qs.set("q", filters.q);
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.scheduledDate) qs.set("scheduledDate", filters.scheduledDate);
  return requestEnvelope<Booking[]>(`/partner/bookings?${qs.toString()}`);
}

export function getIncomingBroadcasts() {
  return request<IncomingBroadcast[]>("/partner/bookings/incoming");
}

export function getBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}`);
}

export function acceptBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/accept`, {
    method: "POST",
  });
}

export function rejectBooking(bookingId: string, reason: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export function markEnRoute(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/en-route`, {
    method: "POST",
  });
}

export function markArrived(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/arrived`, {
    method: "POST",
  });
}

export function startBooking(bookingId: string, otp: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/start`, {
    method: "POST",
    body: { otp },
  });
}

export function completeBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/complete`, {
    method: "POST",
  });
}

export function cancelBooking(bookingId: string, reason: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/cancel`, {
    method: "POST",
    body: { reason },
  });
}

export function disputeBooking(bookingId: string, reason: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/dispute`, {
    method: "POST",
    body: { reason },
  });
}
