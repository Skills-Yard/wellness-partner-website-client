// Client-side day/week/month bucketing for the partner's completed
// bookings — there's no dedicated payout/earnings-summary endpoint on the
// backend (only GET /partner/bookings), so the "Money" screen derives its
// day-wise / week-wise / monthly view from Booking.scheduledDate +
// Booking.partnerEarning itself, same source TodayActivity already sums for
// "Earned today".
//
// scheduledDate comes back as a full ISO instant (e.g.
// "2026-08-21T00:00:00.000Z"), not a plain date — same thing
// BookingsPanel's formatScheduledDate and BookingTrackingPage account for.
// Every calendar computation here works in UTC (getUTC*/Date.UTC) so the
// bucket a booking lands in never shifts with the viewer's local timezone.
import type { Booking } from "@/lib/api/types";

export type EarningsPeriod = "day" | "week" | "month";

export interface DateRange {
  /** Inclusive. */
  start: Date;
  /** Exclusive. */
  end: Date;
}

export interface EarningsBucket {
  key: string;
  /** Short axis label — e.g. "M" (day-of-week), "W2", "J" (month). */
  label: string;
  total: number;
  /** A date inside this bucket, usable as a new anchor if it's clicked. */
  anchorDate: Date;
  isSelected: boolean;
}

/** Booking.scheduledDate, normalized to a UTC midnight Date. */
export function toUTCDateOnly(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export function todayUTC(): Date {
  return toUTCDateOnly(new Date().toISOString());
}

function sameUTCDate(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

/** Moves `anchor` to the previous/next day, week, or month, per `period`. */
export function shiftAnchor(period: EarningsPeriod, anchor: Date, direction: 1 | -1): Date {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const d = anchor.getUTCDate();
  if (period === "day") return new Date(Date.UTC(y, m, d + direction));
  if (period === "week") return new Date(Date.UTC(y, m, d + direction * 7));
  // Month navigation ignores the day-of-month on purpose — anchoring on the
  // 1st sidesteps Date's end-of-month rollover (e.g. Jan 31 -> setUTCMonth
  // +1 lands on Mar 3, silently skipping February).
  return new Date(Date.UTC(y, m + direction, 1));
}

/** The [start, end) window a period+anchor covers — Monday-start weeks. */
export function getRangeForPeriod(period: EarningsPeriod, anchor: Date): DateRange {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const d = anchor.getUTCDate();

  if (period === "day") {
    return { start: new Date(Date.UTC(y, m, d)), end: new Date(Date.UTC(y, m, d + 1)) };
  }
  if (period === "week") {
    const dayOfWeek = anchor.getUTCDay(); // 0 = Sun .. 6 = Sat
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const start = new Date(Date.UTC(y, m, d - daysSinceMonday));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7));
    return { start, end };
  }
  return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)) };
}

function isInRange(date: Date, range: DateRange): boolean {
  return date >= range.start && date < range.end;
}

export function bookingsInRange(bookings: Booking[], range: DateRange): Booking[] {
  return bookings.filter((b) => isInRange(toUTCDateOnly(b.scheduledDate), range));
}

export function sumEarnings(bookings: Booking[]): number {
  return bookings.reduce((sum, b) => sum + b.partnerEarning, 0);
}

/** Human label for the current range — "Today", "24 Aug – 30 Aug 2026", "August 2026". */
export function formatRangeLabel(period: EarningsPeriod, anchor: Date): string {
  const { start, end } = getRangeForPeriod(period, anchor);
  const fmtDay = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

  if (period === "day") {
    if (sameUTCDate(start, todayUTC())) return "Today";
    return start.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  if (period === "week") {
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 1));
    return `${fmtDay(start)} – ${fmtDay(lastDay)}, ${lastDay.getUTCFullYear()}`;
  }
  return start.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Sub-buckets to chart for the current period: day view breaks the
 * containing week into its 7 days, week view breaks the containing month
 * into its weeks, month view breaks the containing year into its 12 months —
 * so switching the segmented control always redraws the chart one level of
 * granularity around wherever `anchor` currently is.
 */
export function buildChartBuckets(
  period: EarningsPeriod,
  anchor: Date,
  completedBookings: Booking[]
): EarningsBucket[] {
  if (period === "day") {
    const { start: weekStart } = getRangeForPeriod("week", anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(
        Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + i)
      );
      const dayEnd = new Date(
        Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate() + 1)
      );
      const total = sumEarnings(bookingsInRange(completedBookings, { start: dayStart, end: dayEnd }));
      return {
        key: dateKey(dayStart),
        label: dayStart.toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" }),
        total,
        anchorDate: dayStart,
        isSelected: sameUTCDate(dayStart, anchor),
      };
    });
  }

  if (period === "week") {
    const { start: monthStart, end: monthEnd } = getRangeForPeriod("month", anchor);
    const buckets: EarningsBucket[] = [];
    let cursor = getRangeForPeriod("week", monthStart).start;
    let weekNum = 1;
    while (cursor < monthEnd) {
      const weekEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 7));
      const rangeStart = cursor > monthStart ? cursor : monthStart;
      const rangeEnd = weekEnd < monthEnd ? weekEnd : monthEnd;
      const total = sumEarnings(
        bookingsInRange(completedBookings, { start: rangeStart, end: rangeEnd })
      );
      buckets.push({
        key: dateKey(cursor),
        label: `W${weekNum}`,
        total,
        anchorDate: rangeStart,
        isSelected: anchor >= cursor && anchor < weekEnd,
      });
      cursor = weekEnd;
      weekNum++;
    }
    return buckets;
  }

  const year = anchor.getUTCFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(Date.UTC(year, i, 1));
    const monthEnd = new Date(Date.UTC(year, i + 1, 1));
    const total = sumEarnings(bookingsInRange(completedBookings, { start: monthStart, end: monthEnd }));
    return {
      key: `${year}-${i}`,
      label: monthStart.toLocaleDateString(undefined, { month: "narrow", timeZone: "UTC" }),
      total,
      anchorDate: monthStart,
      isSelected: anchor.getUTCFullYear() === year && anchor.getUTCMonth() === i,
    };
  });
}
