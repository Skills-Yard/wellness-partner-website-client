"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Lock, Ban } from "lucide-react";
import * as slotsApi from "@/lib/api/slots";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { DayOfWeek, Partner, PartnerAvailability, PartnerSlot, SlotStatus } from "@/lib/api/types";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
  { key: "SAT", label: "Saturday" },
  { key: "SUN", label: "Sunday" },
];

const SLOT_DURATIONS = [30, 60] as const;

interface DaySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [togglingSlotId, setTogglingSlotId] = useState<string | null>(null);

  const loadSlots = async () => {
    const today = new Date();
    const dateFrom = today.toISOString().slice(0, 10);
    const dateTo = new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

  const toggleDay = (day: DayOfWeek) => {
    setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], isActive: !prev[day].isActive } }));
  };

  const updateTime = (day: DayOfWeek, field: "startTime" | "endTime", value: string) => {
    setSchedules((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Both calls always go together: the chunk size a saved window gets
      // split into is whatever slotDurationMinutes is at save time, so the
      // two can never drift apart from what's shown below.
      await partnerApi.updateProfile({ slotDurationMinutes });
      await slotsApi.setAvailability(Object.values(schedules));
      await loadSlots();
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

  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Availability</h1>
      </div>

      {!loaded ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
        </div>
      ) : (
        <div className="px-5 max-w-lg w-full space-y-6">
          {/* Slot size */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">Slot size</p>
            <p className="text-[11px] text-stone-400 mb-2">
              Your weekly hours below get split into slots of this length — that&apos;s the smallest unit a booking
              can start or end on.
            </p>
            <div className="flex gap-2">
              {SLOT_DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSlotDurationMinutes(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                    slotDurationMinutes === d
                      ? "bg-stone-900 text-white shadow-md"
                      : "bg-[#F9F6F0] text-stone-700 hover:bg-stone-100"
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
            <div className="space-y-2">
              {DAYS.map((d) => {
                const s = schedules[d.key];
                return (
                  <div key={d.key} className="flex items-center gap-3 rounded-xl border border-stone-100 bg-[#FAF9F6] px-3 py-2.5">
                    <button
                      onClick={() => toggleDay(d.key)}
                      className={`w-10 h-6 rounded-full shrink-0 transition-colors relative cursor-pointer ${
                        s.isActive ? "bg-stone-900" : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          s.isActive ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-stone-700 w-20 shrink-0">{d.label}</span>
                    {s.isActive && (
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <input
                          type="time"
                          value={s.startTime}
                          onChange={(e) => updateTime(d.key, "startTime", e.target.value)}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white"
                        />
                        <span className="text-stone-400 text-xs">–</span>
                        <input
                          type="time"
                          value={s.endTime}
                          onChange={(e) => updateTime(d.key, "endTime", e.target.value)}
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 w-full rounded-2xl py-3.5 font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save schedule
            </button>
          </div>

          {/* Generated slots */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-1">Next 14 days</p>
            <p className="text-[11px] text-stone-400 mb-3">
              Tap an open slot to block it, or a blocked one to reopen it. Booked slots can&apos;t be changed here.
            </p>
            {slotsByDate.length === 0 && (
              <p className="text-xs text-stone-400">No slots generated yet — save your schedule above.</p>
            )}
            <div className="space-y-4">
              {slotsByDate.map(([date, daySlots]) => (
                <div key={date}>
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
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border transition-all cursor-pointer disabled:cursor-not-allowed ${
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
          </div>
        </div>
      )}
    </div>
  );
}
