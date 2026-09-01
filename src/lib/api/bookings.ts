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

// A job that reached this partner as a member of a BUSINESS team is not won
// outright — the accept records an EMPLOYEE_ACCEPTED offer and the business
// then confirms exactly one. The backend signals that with this shape instead
// of a Booking; see MatchmakingService.acceptBooking.
export interface PendingBusinessConfirmation {
  status: "PENDING_BUSINESS_CONFIRMATION";
  assignment: {
    id: string;
    bookingId: string;
    businessPartnerId: string;
    employeePartnerId: string;
    status: string;
  };
}

export function acceptBooking(bookingId: string) {
  return request<Booking | PendingBusinessConfirmation>(
    `/partner/bookings/${bookingId}/accept`,
    { method: "POST" },
  );
}

export function isPendingBusinessConfirmation(
  result: Booking | PendingBusinessConfirmation,
): result is PendingBusinessConfirmation {
  return (
    "status" in result && result.status === "PENDING_BUSINESS_CONFIRMATION"
  );
}

// ---- Business side: confirm a team member onto a broadcasted booking ----

export interface PendingTeamConfirmation {
  id: string;
  bookingId: string;
  businessPartnerId: string;
  employeePartnerId: string;
  status: string;
  employeeAcceptedAt: string | null;
  employeePartner: { id: string; name?: string | null; profilePhotoKey?: string | null };
  booking: Booking;
}

export function getPendingTeamConfirmations() {
  return request<PendingTeamConfirmation[]>(
    "/partner/bookings/team/pending-confirmations",
  );
}

export function confirmTeamAssignment(bookingId: string, employeePartnerId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/confirm-assignment`, {
    method: "POST",
    body: { employeePartnerId },
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
