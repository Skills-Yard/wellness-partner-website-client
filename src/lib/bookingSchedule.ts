import type { Booking, BookingStatus } from "./api/types";

// Statuses that mean the job never actually started. The backend never
// auto-transitions a booking out of these once its slot passes — there's no
// "missed" status — so a booking can sit here forever after its scheduled
// time if the partner just never opened it. The UI has to notice that on its
// own instead of quietly rendering it as if it were still upcoming.
const PRE_START_STATUSES: BookingStatus[] = ["BROADCASTED", "ACCEPTED", "CONFIRMED"];

// scheduledDate comes back as a UTC-midnight DateTime (e.g.
// "2026-08-21T00:00:00.000Z" — see the formatScheduledDate comments in
// BookingsPanel/BookingTrackingPage), while scheduledTime is a plain local
// "HH:mm" wall-clock string (same convention as PartnerSlot.startTime /
// AvailabilityPanel's time inputs). This pairs the UTC calendar date with
// that local time-of-day into one comparable Date.
export function getScheduledDateTime(booking: Pick<Booking, "scheduledDate" | "scheduledTime">): Date {
  const d = new Date(booking.scheduledDate);
  const [hours, minutes] = booking.scheduledTime.split(":").map(Number);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours || 0, minutes || 0);
}

/**
 * True once a booking's scheduled slot has passed while it was still sitting
 * in a pre-start status — i.e. it was missed, not merely upcoming. Bookings
 * already en route/arrived/in progress/concluded are never "overdue" here;
 * once a partner has actually started a job, running past its scheduled time
 * is a different (live-tracking) concern, not a missed one.
 */
export function isBookingOverdue(
  booking: Pick<Booking, "status" | "scheduledDate" | "scheduledTime">,
  now: Date = new Date()
): boolean {
  if (!PRE_START_STATUSES.includes(booking.status)) return false;
  return getScheduledDateTime(booking) < now;
}
