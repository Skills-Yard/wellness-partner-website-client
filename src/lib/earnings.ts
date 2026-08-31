import type { Booking } from "./api/types";
import { getScheduledDateTime } from "./bookingSchedule";

// There's no partner earnings/analytics endpoint yet — the only money signal
// on the wire is `partnerEarning` on a COMPLETED booking. Everything the Home
// dashboard shows for earnings (the weekly chart + the "this week" stat) is
// derived here from a page of recent completed bookings, bucketed by the day
// the job was scheduled for (Booking has no `completedAt`, so scheduledDate
// is the only date to bucket on). Accurate for recent weeks; older weeks go
// partial once they fall off the fetched page.

export interface EarningsPoint {
  /** "Mon", "Tue", … */
  label: string;
  /** Rupees earned that day. */
  value: number;
  /** ISO date (yyyy-mm-dd) of that day, for keys/tooltips. */
  date: string;
}

export interface WeeklyEarnings {
  /** Exactly 7 points, Monday → Sunday. */
  points: EarningsPoint[];
  /** Sum of all 7 points. */
  total: number;
  /** How many completed bookings landed in the week. */
  jobCount: number;
  /** The highest-earning day, or null when the week earned nothing. */
  peak: EarningsPoint | null;
  /** e.g. "18–24 Aug" (or "28 Jul–3 Aug" across a month boundary). */
  rangeLabel: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Local-midnight Monday of the week `ref` falls in. */
export function startOfWeek(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  // getDay(): 0=Sun..6=Sat → days since Monday.
  const sinceMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - sinceMonday);
  return d;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * @param weekOffset 0 = the week containing `now`, -1 = the week before, etc.
 */
export function bucketWeeklyEarnings(
  bookings: Booking[],
  weekOffset = 0,
  now: Date = new Date()
): WeeklyEarnings {
  const weekStart = addDays(startOfWeek(now), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7); // exclusive

  const points: EarningsPoint[] = DAY_LABELS.map((label, i) => ({
    label,
    value: 0,
    date: isoDate(addDays(weekStart, i)),
  }));

  let jobCount = 0;
  for (const booking of bookings) {
    if (booking.status !== "COMPLETED") continue;
    const when = getScheduledDateTime(booking);
    if (when < weekStart || when >= weekEnd) continue;
    const dayIndex = Math.floor((when.getTime() - weekStart.getTime()) / 86_400_000);
    if (dayIndex < 0 || dayIndex > 6) continue;
    points[dayIndex].value += booking.partnerEarning;
    jobCount += 1;
  }

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const peak = total > 0 ? points.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  const lastDay = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === lastDay.getMonth();
  const rangeLabel = sameMonth
    ? `${weekStart.getDate()}–${lastDay.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
    : `${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })}–${lastDay.toLocaleDateString(
        undefined,
        { day: "numeric", month: "short" }
      )}`;

  return { points, total, jobCount, peak, rangeLabel };
}

/** "₹6,540" — Indian digit grouping, rounded to whole rupees. */
export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Smallest "round" number ≥ `value` (1/2/5 × 10ⁿ) — a sane y-axis ceiling so
 * the chart's top gridline is a clean figure rather than the raw max.
 */
export function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}
