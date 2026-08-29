"use client";

import React, { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useCompletedBookings } from "@/hooks/queries/useBookings";
import { bucketWeeklyEarnings, formatINR, niceCeil } from "@/lib/earnings";
import { Shimmer } from "@/components/ui/shimmer";

// SVG user-space box. Only the plot area lives in the SVG — y-tick labels and
// weekday labels are HTML alongside it, so text stays crisp while the plot
// stretches to the card's width (preserveAspectRatio="none").
const VIEW_W = 520;
const VIEW_H = 150;
const PLOT_TOP = 12;

function compactINR(n: number): string {
  if (n < 1000) return `₹${Math.round(n)}`;
  const k = n / 1000;
  return `₹${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

const WEEK_OPTIONS = [
  { value: 0, label: "This week" },
  { value: -1, label: "Last week" },
] as const;

/**
 * Weekly earnings, derived entirely client-side from a page of recent
 * COMPLETED bookings (see lib/earnings.ts + useCompletedBookings) — there's
 * no earnings endpoint. "This week / Last week" both come out of the same
 * fetched page, so switching between them costs nothing.
 */
export default function EarningsOverviewCard({ enabled }: { enabled: boolean }) {
  const { bookings, isLoading, isError } = useCompletedBookings(enabled);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const week = bucketWeeklyEarnings(bookings, weekOffset);
  const ceil = niceCeil(Math.max(...week.points.map((p) => p.value)));

  const x = (i: number) => (i / 6) * VIEW_W;
  const y = (value: number) => PLOT_TOP + (1 - value / ceil) * (VIEW_H - PLOT_TOP);

  const linePath = week.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const areaPath = `${linePath} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`;
  const peakIndex = week.peak ? week.points.findIndex((p) => p.date === week.peak!.date) : -1;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-stone-900">Earnings overview</h3>
        <select
          value={weekOffset}
          onChange={(e) => setWeekOffset(Number(e.target.value))}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-bold text-stone-600 cursor-pointer focus:outline-none focus:border-stone-400"
        >
          {WEEK_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          <Shimmer className="h-7 w-32 rounded-lg" />
          <Shimmer className="h-32 w-full rounded-xl" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-stone-900">No earnings yet</p>
          <p className="text-xs text-stone-500 mt-1 max-w-[16rem]">
            Your weekly earnings will appear here once you complete your first booking.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900 tracking-tight">
              {formatINR(week.total)}
            </span>
            <span className="text-xs font-medium text-stone-400">{week.rangeLabel}</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            {week.jobCount === 0
              ? "No completed jobs in this week"
              : `${week.jobCount} completed ${week.jobCount === 1 ? "job" : "jobs"}`}
          </p>
          {isError && (
            <p className="text-[11px] font-medium text-red-500 mt-1">
              Some earnings data couldn&apos;t be loaded.
            </p>
          )}

          <div className="mt-4 flex gap-2 flex-1">
            <div className="flex w-9 shrink-0 flex-col justify-between py-[10px] text-[9px] font-medium text-stone-350 text-right leading-none">
              <span>{compactINR(ceil)}</span>
              <span>{compactINR(ceil / 2)}</span>
              <span>₹0</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="relative">
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  preserveAspectRatio="none"
                  className="w-full block"
                  style={{ height: VIEW_H }}
                >
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9851A" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#C9851A" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[PLOT_TOP, (PLOT_TOP + VIEW_H) / 2, VIEW_H].map((gy) => (
                    <line
                      key={gy}
                      x1="0"
                      y1={gy}
                      x2={VIEW_W}
                      y2={gy}
                      stroke="#EEECE6"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  <path d={areaPath} fill="url(#earningsFill)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#C9851A"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {week.peak && peakIndex >= 0 && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{
                      left: `${(peakIndex / 6) * 100}%`,
                      top: `${(y(week.peak.value) / VIEW_H) * 100}%`,
                    }}
                  >
                    <span className="mb-1 rounded-md bg-stone-900 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">
                      {formatINR(week.peak.value)}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-[#C9851A] shadow-sm" />
                  </div>
                )}
              </div>

              <div className="mt-1.5 flex justify-between text-[10px] font-medium text-stone-400">
                {week.points.map((p) => (
                  <span key={p.date}>{p.label}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
