"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import * as slotsApi from "@/lib/api/slots";
import { ApiError } from "@/lib/api/client";
import type { DayOfWeek, PartnerAvailability, PartnerSlot } from "@/lib/api/types";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "MON", label: "Monday" },
  { key: "TUE", label: "Tuesday" },
  { key: "WED", label: "Wednesday" },
  { key: "THU", label: "Thursday" },
  { key: "FRI", label: "Friday" },
  { key: "SAT", label: "Saturday" },
  { key: "SUN", label: "Sunday" },
];

interface DaySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function AvailabilityPanel({ onBack }: { onBack: () => void }) {
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

  useEffect(() => {
    Promise.all([slotsApi.getAvailability(), slotsApi.getSlots({ status: "AVAILABLE" })])
      .then(([avail, slotList]) => {
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
        setSlots(slotList);
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
      await slotsApi.setAvailability(Object.values(schedules));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your availability.");
    } finally {
      setSaving(false);
    }
  };

  const blockSlot = async (slotId: string) => {
    try {
      await slotsApi.updateSlotStatus(slotId, "BLOCKED_BY_PARTNER");
      setSlots((prev) => prev.map((s) => (s.id === slotId ? { ...s, status: "BLOCKED_BY_PARTNER" } : s)));
    } catch {
      // best-effort
    }
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

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400 mb-3">
              Upcoming open slots
            </p>
            {slots.length === 0 && (
              <p className="text-xs text-stone-400">No open slots generated yet — save your schedule above.</p>
            )}
            <div className="space-y-2">
              {slots.slice(0, 20).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between rounded-xl border border-stone-100 px-3 py-2.5">
                  <span className="text-xs font-semibold text-stone-700">
                    {slot.date} · {slot.startTime}–{slot.endTime}
                  </span>
                  <button
                    onClick={() => blockSlot(slot.id)}
                    className="text-[11px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    Block
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
