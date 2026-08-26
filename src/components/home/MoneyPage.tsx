'use client';

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Settings, Bell, Calendar, Wallet, Banknote, Clock, ArrowRight, User, Loader2, AlertCircle } from "lucide-react";
import { useCompletedBookings } from "@/hooks/queries/useEarnings";
import type { Booking } from "@/lib/api/types";
import {
  type EarningsPeriod,
  bookingsInRange,
  buildChartBuckets,
  formatRangeLabel,
  getRangeForPeriod,
  shiftAnchor,
  sumEarnings,
  todayUTC,
} from "@/utils/earnings";

const PERIODS: { value: EarningsPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function serviceName(booking: Booking) {
  return booking.items?.[0]?.serviceItemName ?? "Booking";
}

function formatBookingDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatDuration(minutes: number) {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} hr${hours === 1 ? "" : "s"}`;
}

/**
 * Segmented Day / Week / Month control + prev/next-period chart, all driven
 * off the same `period` + `anchor` state — switching the control re-buckets
 * whatever's already loaded rather than refetching, and the chevrons just
 * move `anchor` one period at a time (see utils/earnings.shiftAnchor).
 */
function EarningsCard({
  completedBookings,
  period,
  onPeriodChange,
  anchor,
  onAnchorChange,
}: {
  completedBookings: Booking[];
  period: EarningsPeriod;
  onPeriodChange: (p: EarningsPeriod) => void;
  anchor: Date;
  onAnchorChange: (d: Date) => void;
}) {
  const range = useMemo(() => getRangeForPeriod(period, anchor), [period, anchor]);
  const rangeBookings = useMemo(
    () => bookingsInRange(completedBookings, range),
    [completedBookings, range]
  );
  const rangeTotal = useMemo(() => sumEarnings(rangeBookings), [rangeBookings]);
  const buckets = useMemo(
    () => buildChartBuckets(period, anchor, completedBookings),
    [period, anchor, completedBookings]
  );
  const maxBucketTotal = Math.max(1, ...buckets.map((b) => b.total));

  // "Next" shouldn't march a partner into the future past today's period —
  // there's nothing to show there yet.
  const canGoNext = getRangeForPeriod(period, anchor).end <= todayUTC();

  return (
    <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
      {/* Day / Week / Month toggle */}
      <div className="flex items-center gap-1 bg-stone-100 rounded-2xl p-1 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              period === p.value ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onAnchorChange(shiftAnchor(period, anchor, -1))}
          className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50"
        >
          <ChevronLeft className="w-4 h-4 text-stone-600" />
        </button>
        <div className="text-center">
          <div className="text-2xl font-black text-green-600 tracking-tight">
            ₹{rangeTotal.toFixed(0)}
          </div>
          <div className="text-[11px] font-bold text-stone-600 mt-1">{formatRangeLabel(period, anchor)}</div>
        </div>
        <button
          onClick={() => canGoNext && onAnchorChange(shiftAnchor(period, anchor, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      {/* Chart — day view: 7 days of the week; week view: weeks of the month;
          month view: 12 months of the year. Tapping a bar jumps the anchor
          there. */}
      <div className="h-24 mt-6 flex items-end gap-1.5 border-b-2 border-green-500/80 px-2">
        {buckets.map((bucket) => (
          <button
            key={bucket.key}
            onClick={() => onAnchorChange(bucket.anchorDate)}
            className="flex-1 h-full flex flex-col items-end justify-end group cursor-pointer"
            title={`₹${bucket.total.toFixed(0)}`}
          >
            <div
              className={`w-full rounded-t-lg transition-all ${
                bucket.isSelected ? "bg-green-500" : "bg-green-100 group-hover:bg-green-300"
              }`}
              style={{ height: `${Math.max(6, (bucket.total / maxBucketTotal) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 px-2 mt-1">
        {buckets.map((bucket) => (
          <div key={bucket.key} className="flex-1 text-center text-[9px] font-bold text-stone-400">
            {bucket.label}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-stone-500">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium">
          {rangeBookings.length} job{rangeBookings.length === 1 ? "" : "s"} completed in this period
        </span>
      </div>
    </div>
  );
}

function BreakdownCard({ bookings, total }: { bookings: Booking[]; total: number }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-5 py-8 text-center">
        <p className="text-xs font-medium text-stone-400">No completed jobs in this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-5 py-2">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-b-0">
          <div className="min-w-0 pr-3">
            <div className="text-xs font-bold truncate">{serviceName(booking)}</div>
            <div className="text-[10px] text-stone-500">
              {formatBookingDate(booking.scheduledDate)} · {formatDuration(booking.estimatedDurationMinutes)}
            </div>
          </div>
          <div className="text-xs font-bold shrink-0">₹{booking.partnerEarning.toFixed(0)}</div>
        </div>
      ))}
      <div className="flex items-center justify-between py-4 border-t border-stone-100">
        <div className="text-sm font-extrabold">Total</div>
        <div className="text-sm font-extrabold">₹{total.toFixed(0)}</div>
      </div>
    </div>
  );
}

export default function MoneyPage() {
  const { data: completedBookings, isLoading, isError, error, refetch } = useCompletedBookings();
  const [period, setPeriod] = useState<EarningsPeriod>("day");
  const [anchor, setAnchor] = useState<Date>(() => todayUTC());

  const range = useMemo(() => getRangeForPeriod(period, anchor), [period, anchor]);
  const rangeBookings = useMemo(
    () =>
      completedBookings
        ? [...bookingsInRange(completedBookings, range)].sort(
            (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
          )
        : [],
    [completedBookings, range]
  );
  const rangeTotal = useMemo(() => sumEarnings(rangeBookings), [rangeBookings]);

  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col pb-28 lg:pb-10 text-stone-900 font-sans">
      {/* ── Top bar ── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <User className="h-5 w-5 text-stone-600" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#F5E6D3] rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
            <Settings className="h-5 w-5 text-[#C9851A]" strokeWidth={1.5} />
          </div>
          <div className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
            <Bell className="h-5 w-5 text-stone-600" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-2">
        <h1 className="text-xl font-extrabold tracking-tight">Money</h1>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col gap-5">

        {isLoading && (
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-xs font-medium text-stone-500">
              {error instanceof Error ? error.message : "Could not load your earnings."}
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs font-bold text-[#C9851A] cursor-pointer hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* ── Earnings Card ── */}
            <EarningsCard
              completedBookings={completedBookings ?? []}
              period={period}
              onPeriodChange={setPeriod}
              anchor={anchor}
              onAnchorChange={setAnchor}
            />

            {/* ── Breakdown Card ── */}
            <BreakdownCard bookings={rangeBookings} total={rangeTotal} />
          </>
        )}

        {/* ── Bank transfers Section ── */}
        <div>
          <h2 className="text-sm font-extrabold px-1 mb-3">Bank transfers</h2>
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="w-20 h-14 relative -ml-2">
                <img src="/images/wallet_transfers.png" alt="Wallet" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-1 text-[#C9851A] pr-2">
                <span className="text-xs font-bold">See all</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">PENDING DEDUCTIONS</div>
                  <div className="text-sm font-extrabold">₹0</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* ── Explore more Section ── */}
        <div>
          <h2 className="text-sm font-extrabold px-1 mb-3">Explore more</h2>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col">
            {[
              { title: "Loans", sub: "No loans available", icon: <Wallet className="w-5 h-5" /> },
              { title: "Recoveries", sub: "0 recoveries active", icon: <Clock className="w-5 h-5" /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10px] text-stone-500">{item.sub}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-3 p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold">Credits</div>
                <div className="text-[10px] text-stone-500">₹0</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
