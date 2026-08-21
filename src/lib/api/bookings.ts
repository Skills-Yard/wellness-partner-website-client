import { request } from "./client";
import type { Booking, IncomingBroadcast } from "./types";

export function getBookings() {
  return request<Booking[]>("/partner/bookings");
}

export function getIncomingBroadcasts() {
  return request<IncomingBroadcast[]>("/partner/bookings/incoming");
}

export function getBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}`);
}

export function acceptBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/accept`, { method: "POST" });
}

export function rejectBooking(bookingId: string, reason: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

export function markEnRoute(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/en-route`, { method: "POST" });
}

export function markArrived(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/arrived`, { method: "POST" });
}

export function startBooking(bookingId: string, otp: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/start`, {
    method: "POST",
    body: { otp },
  });
}

export function completeBooking(bookingId: string) {
  return request<Booking>(`/partner/bookings/${bookingId}/complete`, { method: "POST" });
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
