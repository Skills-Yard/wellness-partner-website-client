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

// scheduledTime is a plain 24h "HH:mm" wall-clock string — render it as
// "h:mm AM/PM".
export function formatWallClock12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

/**
 * Human "when" for a booking's scheduled slot: "Today, 3:00 PM" /
 * "Tomorrow, 3:00 PM" / "Wed, Sep 3 · 3:00 PM". scheduledDate is a
 * UTC-midnight instant standing in for a calendar date (see
 * getScheduledDateTime), so its date part and weekday are read in UTC to
 * avoid sliding a day in a positive-offset timezone.
 */
export function formatBookingWhen(
  booking: Pick<Booking, "scheduledDate" | "scheduledTime">
): string {
  const datePart = booking.scheduledDate.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const time = formatWallClock12h(booking.scheduledTime);

  if (datePart === today) return `Today, ${time}`;
  if (datePart === tomorrow) return `Tomorrow, ${time}`;

  const label = new Date(booking.scheduledDate).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${label} · ${time}`;
}
