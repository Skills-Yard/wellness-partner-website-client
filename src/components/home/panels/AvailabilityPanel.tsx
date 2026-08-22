"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Info,
  Loader2,
  Lock,
  Save,
  Square,
  Sun,
  X,
} from "lucide-react";
import * as slotsApi from "@/lib/api/slots";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import { Shimmer } from "@/components/ui/shimmer";
import type { DayOfWeek, Partner, PartnerAvailability, PartnerSlot, SlotStatus } from "@/lib/api/types";

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "MON", label: "Monday", short: "Mon" },
  { key: "TUE", label: "Tuesday", short: "Tue" },
  { key: "WED", label: "Wednesday", short: "Wed" },
  { key: "THU", label: "Thursday", short: "Thu" },
  { key: "FRI", label: "Friday", short: "Fri" },
  { key: "SAT", label: "Saturday", short: "Sat" },
  { key: "SUN", label: "Sunday", short: "Sun" },
];

const SLOT_DURATIONS = [30, 60] as const;

const TIP_DISMISSED_KEY = "eezit-partner-availability-tip-dismissed";

interface DaySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

/** A small on-brand calendar + clock mark — used for the two decorative
 *  cards on this page. Plain inline SVG, no image asset. */
function CalendarClockMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className="shrink-0">
      <rect x="4" y="8" width="40" height="36" rx="8" fill="#FFF3DE" />
      <rect x="4" y="8" width="40" height="12" rx="8" fill="#C9851A" />
      <rect x="4" y="14" width="40" height="6" fill="#C9851A" />
      {[0, 1, 2, 3].map((col) =>
        [0, 1, 2].map((row) => (
          <circle
            key={`${col}-${row}`}
            cx={11 + col * 8.5}
            cy={27 + row * 7}
            r="2"
            fill={col === 1 && row === 1 ? "#C9851A" : "#EADFC8"}
          />
        ))
      )}
      <circle cx="42" cy="40" r="12" fill="white" stroke="#C9851A" strokeWidth="2.5" />
      <path d="M42 33v7l5 3" stroke="#C9851A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Desktop ("pc") day selector — unchanged: a 7-up grid of toggle cards ──

function DayCard({ short, active, onToggle }: { short: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={`flex flex-col items-center gap-2.5 rounded-2xl border p-3 sm:p-4 transition-all duration-200 cursor-pointer active:scale-[0.97] ${
        active ? "border-[#C9851A] bg-[#FFF8EC] shadow-sm" : "border-stone-100 bg-white hover:border-stone-200"
      }`}
    >
      <span className={`text-xs sm:text-sm font-bold transition-colors ${active ? "text-stone-900" : "text-stone-500"}`}>
        {short}
      </span>
      <Sun className={`h-5 w-5 transition-colors duration-200 ${active ? "text-[#C9851A]" : "text-stone-300"}`} />
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
          active ? "bg-[#C9851A]" : "bg-stone-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            active ? "translate-x-4.5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

// ── Mobile/tablet day selector — a collapsible row per day, expanding to
// show its time range only while that day is on ──

function CompactDayRow({
  day,
  schedule,
  onToggle,
  onTimeChange,
}: {
  day: { key: DayOfWeek; label: string };
  schedule: DaySchedule;
  onToggle: () => void;
  onTimeChange: (field: "startTime" | "endTime", value: string) => void;
}) {
  const { isActive } = schedule;
  return (
    <div
      className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${
        isActive ? "border-[#C9851A]/40 bg-[#FFFBF3]" : "border-stone-100 bg-white"
      }`}
    >
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer">
        <span
          role="switch"
          aria-checked={isActive}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
            isActive ? "bg-[#C9851A]" : "bg-stone-200"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              isActive ? "translate-x-4.5" : "translate-x-1"
            }`}
          />
        </span>
        <span className={`flex-1 text-left text-sm font-bold ${isActive ? "text-stone-900" : "text-stone-600"}`}>
          {day.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 shrink-0 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
        />
      </button>

      {isActive && (
        <div className="px-4 pb-4 animate-expand origin-top">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-stone-500 mb-1">Start time</p>
              <input
                type="time"
                value={schedule.startTime}
                onChange={(e) => onTimeChange("startTime", e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-2.5 py-2 bg-white text-xs"
              />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-stone-500 mb-1">End time</p>
              <input
                type="time"
                value={schedule.endTime}
                onChange={(e) => onTimeChange("endTime", e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-2.5 py-2 bg-white text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="px-5 sm:px-8 max-w-5xl w-full mx-auto space-y-6">
      <Shimmer className="h-24 w-full rounded-2xl" />
      <Shimmer className="h-40 w-full rounded-2xl" />
      <Shimmer className="h-72 w-full rounded-2xl" />
      <Shimmer className="h-24 w-full rounded-2xl" />
    </div>
  );
}

/**
 * Availability (PartnerAvailability) is a cumulative weekly window per day —
 * "Monday 9am-6pm". Slots (PartnerSlot) are the small, fixed-size, bookable
 * chunks the backend actually rolls that window into (see
 * PartnerService.generateSlotsFromAvailability / chunkWindow) — the
 * customer-facing booking flow (SlotService.computeWindows) stitches
 * consecutive chunks together to cover whatever duration a booking needs,
 * treating each PartnerSlot row as indivisible. So this screen edits the
 * cumulative window + chunk size, then shows/lets the partner block the
 * concrete generated chunks — it never lets the partner touch PartnerSlot
 * rows directly in a way that would produce something other than
 * consistently-sized, contiguous slots.
 *
 * Below xl, this renders a different (more compact) layout for the slot
 * duration + weekly schedule sections than it does at xl and above — same
 * underlying state either way, just two render branches. One thing that's
 * NOT built here despite showing up in a reference design: multiple time
 * slots per day, and a break time. The backend's PartnerAvailability model
 * has a unique (partnerId, dayOfWeek) constraint and no break-time columns
 * at all — one row per day, start/end only — so that UI would have nowhere
 * real to save to. Flagging rather than building it as decoration.
 */
export default function AvailabilityPanel({ partner, onBack }: { partner: Partner; onBack: () => void }) {
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<30 | 60>(
    partner.slotDurationMinutes === 60 ? 60 : 30
  );
  const [schedules, setSchedules] = useState<Record<DayOfWeek, DaySchedule>>(() => {
    const base = {} as Record<DayOfWeek, DaySchedule>;
    DAYS.forEach((d) => {
      base[d.key] = { dayOfWeek: d.key, startTime: "09:00", endTime: "18:00", isActive: false };
    });
    return base;
  });
  const [slots, setSlots] = useState<PartnerSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingSlotId, setTogglingSlotId] = useState<string | null>(null);

  // Dismissible tip at the bottom — remembered across visits, same
  // localStorage-preference pattern as the sidebar's collapse state.
  const [tipDismissed, setTipDismissed] = useState(true);
  const [tipClosing, setTipClosing] = useState(false);

  const loadSlots = async () => {
    const today = new Date();
    const dateFrom = today.toISOString().slice(0, 10);
    // 6 days out + today = a 7-day window.
    const dateTo = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const list = await slotsApi.getSlots({ dateFrom, dateTo });
    setSlots(list);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render-loop hazard
    Promise.all([slotsApi.getAvailability(), loadSlots()])
      .then(([avail]) => {
        setSchedules((prev) => {
          const next = { ...prev };
          avail.forEach((a: PartnerAvailability) => {
            next[a.dayOfWeek] = {
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
              isActive: a.isActive,
            };
          });
          return next;
        });
      })
      .catch(() => {
        // no availability set yet — defaults stand
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a one-time persisted preference on mount, not a render-loop hazard
    setTipDismissed(window.localStorage.getItem(TIP_DISMISSED_KEY) === "true");
  }, []);

  const dismissTip = () => {
    setTipClosing(true);
    window.setTimeout(() => {
      setTipDismissed(true);
      window.localStorage.setItem(TIP_DISMISSED_KEY, "true");
    }, 250);
  };

  const toggleDay = (day: DayOfWeek) => {
    setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], isActive: !prev[day].isActive } }));
  };

  const allDaysActive = DAYS.every((d) => schedules[d.key].isActive);
  const toggleSelectAll = () => {
    setSchedules((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d.key] = { ...next[d.key], isActive: !allDaysActive };
      });
      return next;
    });
  };

  const updateTime = (day: DayOfWeek, field: "startTime" | "endTime", value: string) => {
    setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // Both calls always go together: the chunk size a saved window gets
      // split into is whatever slotDurationMinutes is at save time, so the
      // two can never drift apart from what's shown below.
      await partnerApi.updateProfile({ slotDurationMinutes });
      await slotsApi.setAvailability(Object.values(schedules));
      await loadSlots();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your availability.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSlot = async (slot: PartnerSlot) => {
    const nextStatus: SlotStatus = slot.status === "BLOCKED_BY_PARTNER" ? "AVAILABLE" : "BLOCKED_BY_PARTNER";
    setTogglingSlotId(slot.id);
    try {
      await slotsApi.updateSlotStatus(slot.id, nextStatus);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: nextStatus } : s)));
    } catch {
      // best-effort — partner can retry
    } finally {
      setTogglingSlotId(null);
    }
  };

  const slotsByDate = useMemo(() => {
    const map = new Map<string, PartnerSlot[]>();
    slots.forEach((s) => {
      const list = map.get(s.date) ?? [];
      list.push(s);
      map.set(s.date, list);
    });
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  const activeDays = DAYS.filter((d) => schedules[d.key].isActive);

  // slot.date comes back as a full ISO instant (e.g. "2026-08-21T00:00:00.000Z")
  // — it's a real DateTime column on the backend, not a plain "YYYY-MM-DD"
  // string — so parsing it directly (not appending another "T00:00:00", which
  // produced an invalid string and showed as "Invalid Date") and formatting
  // in UTC keeps this showing the same calendar day the backend meant,
  // regardless of the viewer's own timezone.
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  };

  const saveButtonContent = saving ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : saved ? (
    <Check className="h-4 w-4" />
  ) : (
    <Save className="h-4 w-4" />
  );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      {/* ── Header ── */}
      <div className="px-5 sm:px-8 pt-6 pb-6 max-w-5xl w-full mx-auto">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={onBack}
              className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-5 h-5 text-stone-700" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900">Availability &amp; slots</h1>
              {/* Descriptive line only at the wider "pc" layout — the compact layout folds this into the Slot size section instead */}
              <p className="hidden xl:block text-xs sm:text-sm text-stone-500 mt-1 max-w-md leading-relaxed">
                Set your weekly availability and slot duration. This helps customers see when you&apos;re open and
                book you easily.
              </p>
            </div>
          </div>

          {/* Decorative — "pc" only, no room for it once the layout narrows */}
          <div className="hidden xl:flex items-center gap-4 bg-linear-to-br from-[#FFF6E9] to-white border border-[#F5E3C6] rounded-2xl px-5 py-4 shrink-0 animate-fade-in-up">
            <CalendarClockMark />
            <div>
              <p className="text-sm font-extrabold text-stone-900">Stay in control</p>
              <p className="text-xs text-stone-500 mt-1 max-w-[180px] leading-relaxed">
                Update your schedule anytime. You can turn days on or off whenever you need to.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!loaded ? (
        <PageSkeleton />
      ) : (
        <div className="px-5 sm:px-8 max-w-5xl w-full mx-auto space-y-6 animate-fade-in-up">
          {/* ══════════════ Mobile / tablet layout (below xl) ══════════════ */}
          <div className="xl:hidden space-y-6">
            {/* Slot size */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-2">Slot size</p>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed max-w-md">
                Your weekly hours below get split into slots of this length — that&apos;s the smallest unit a
                booking can start or end on.
              </p>
              <div className="flex gap-2.5">
                {SLOT_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSlotDurationMinutes(d)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                      slotDurationMinutes === d
                        ? "bg-stone-900 text-white shadow-md"
                        : "bg-[#F3EDE2] text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly schedule */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Weekly schedule</p>
              <div className="space-y-2.5">
                {DAYS.map((d) => (
                  <CompactDayRow
                    key={d.key}
                    day={d}
                    schedule={schedules[d.key]}
                    onToggle={() => toggleDay(d.key)}
                    onTimeChange={(field, value) => updateTime(d.key, field, value)}
                  />
                ))}
              </div>

              {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`mt-5 w-full rounded-xl py-3.5 font-bold text-sm shadow-lg cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 ${
                  saved ? "bg-green-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800"
                }`}
              >
                {saveButtonContent}
                {saved ? "Saved" : "Save schedule"}
              </button>
            </div>
          </div>

          {/* ══════════════ Desktop / "pc" layout (xl and up) — unchanged ══════════════ */}
          <div className="hidden xl:block space-y-6">
            {/* Slot duration */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <p className="text-sm font-extrabold text-stone-900">Slot duration</p>
              <p className="text-xs text-stone-500 mt-0.5 mb-4">Choose the duration for each booking slot.</p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {SLOT_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSlotDurationMinutes(d)}
                    className={`shrink-0 sm:w-32 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                      slotDurationMinutes === d
                        ? "bg-[#C9851A] text-white shadow-md"
                        : "bg-[#F9F6F0] text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
                <div className="flex-1 flex items-center gap-2 rounded-xl bg-[#FDF3E7] px-3.5 py-2.5 min-w-0">
                  <Info className="h-3.5 w-3.5 text-[#C9851A] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-medium text-[#8C6318] truncate">
                    This will be applied to all your bookings.
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-extrabold text-stone-900">Weekly schedule</p>
                  <p className="text-xs text-stone-500 mt-0.5">Select the days you&apos;re available for bookings.</p>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  {allDaysActive ? (
                    <CheckSquare className="h-3.5 w-3.5 text-[#C9851A]" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  Select all
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2.5">
                {DAYS.map((d) => (
                  <DayCard key={d.key} short={d.short} active={schedules[d.key].isActive} onToggle={() => toggleDay(d.key)} />
                ))}
              </div>

              {/* Per-day time range — only for the days just turned on, each animating in/out with the toggle above */}
              {activeDays.length > 0 && (
                <div className="mt-4 space-y-2">
                  {activeDays.map((d) => (
                    <div
                      key={d.key}
                      className="flex items-center gap-3 rounded-xl border border-stone-100 bg-[#FAF9F6] px-3 py-2.5 animate-expand origin-top"
                    >
                      <span className="text-xs font-bold text-stone-700 w-20 shrink-0">{d.label}</span>
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="time"
                          value={schedules[d.key].startTime}
                          onChange={(e) => updateTime(d.key, "startTime", e.target.value)}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white"
                        />
                        <span className="text-stone-400 text-xs">–</span>
                        <input
                          type="time"
                          value={schedules[d.key].endTime}
                          onChange={(e) => updateTime(d.key, "endTime", e.target.value)}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`mt-5 w-full rounded-full py-3.5 font-bold text-sm shadow-lg cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 ${
                  saved ? "bg-green-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800"
                }`}
              >
                {saveButtonContent}
                {saved ? "Saved" : "Save schedule"}
              </button>
            </div>
          </div>

          {/* ── Next 7 days — shared by both layouts ── */}
          <div className="bg-[#FAF9F6] rounded-2xl border border-stone-100 p-5 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-[#C9851A]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Next 7 days</p>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                  Tap an open slot to block it, or a blocked one to reopen it. Booked slots can&apos;t be changed
                  here.
                </p>

                {slotsByDate.length === 0 ? (
                  <p className="text-xs text-stone-400 mt-3">No slots generated yet — save your schedule above.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {slotsByDate.map(([date, daySlots], groupIndex) => (
                      <div key={date} className="animate-fade-in-up" style={{ animationDelay: `${groupIndex * 40}ms` }}>
                        <p className="text-xs font-bold text-stone-700 mb-2">{formatDate(date)}</p>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot) => {
                            const isAvailable = slot.status === "AVAILABLE";
                            const isBlocked = slot.status === "BLOCKED_BY_PARTNER";
                            const isBusy = !isAvailable && !isBlocked; // BOOKED / HELD / EXPIRED
                            const isToggling = togglingSlotId === slot.id;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => !isBusy && toggleSlot(slot)}
                                disabled={isBusy || isToggling}
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all duration-200 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 ${
                                  isAvailable
                                    ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    : isBlocked
                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    : "border-stone-200 bg-stone-100 text-stone-400"
                                }`}
                              >
                                {isToggling && <Loader2 className="h-3 w-3 animate-spin" />}
                                {isBlocked && !isToggling && <Lock className="h-3 w-3" />}
                                {isBusy && <Ban className="h-3 w-3" />}
                                {slot.startTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden xl:block shrink-0 opacity-70">
                <CalendarClockMark size={64} />
              </div>
            </div>
          </div>

          {/* ── Tip — shared by both layouts ── */}
          {!tipDismissed && (
            <div
              className={`flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 transition-all duration-250 overflow-hidden ${
                tipClosing ? "max-h-0 opacity-0 py-0 border-0" : "max-h-40 opacity-100 py-3.5"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-green-800">Tip: Keep your schedule updated</p>
                <p className="text-xs text-green-700/80 mt-0.5 leading-relaxed">
                  An updated schedule helps you get more bookings and keeps your customers happy.
                </p>
              </div>
              <button
                onClick={dismissTip}
                className="shrink-0 p-1 rounded-full text-green-700/60 hover:bg-green-100 hover:text-green-800 transition-colors cursor-pointer"
                aria-label="Dismiss tip"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
