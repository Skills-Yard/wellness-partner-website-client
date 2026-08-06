import React from "react";
import { Search, Check, Loader2, MapPin } from "lucide-react";
import type { ServiceableZone } from "@/lib/api/types";

interface ServiceAreaStepProps {
  zones: ServiceableZone[];
  loading: boolean;
  error: string | null;
  selectedZoneId: string | null;
  onSelect: (zone: ServiceableZone) => void;
  search: string;
  setSearch: (value: string) => void;
  onContinue: () => void;
}

/**
 * Asked before "what services do you offer?" — the partner's chosen zone
 * (service area) is what scopes the subsequent services fetch to what's
 * actually operable there (x-zone-id), rather than showing a global,
 * possibly-irrelevant catalog.
 */
export default function ServiceAreaStep({
  zones,
  loading,
  error,
  selectedZoneId,
  onSelect,
  search,
  setSearch,
  onContinue,
}: ServiceAreaStepProps) {
  const filtered = zones.filter(
    (z) =>
      z.city.toLowerCase().includes(search.toLowerCase()) ||
      z.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 bg-white animate-in fade-in duration-300">
      <div className="px-5 pt-6 pb-2 shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-3">
          <MapPin className="h-6 w-6 text-[#C9851A]" />
        </div>
        <h2 className="text-[22px] font-extrabold text-stone-900 mb-1 leading-snug">
          Where will you <span className="underline decoration-2 underline-offset-2">work?</span>
        </h2>
        <p className="text-sm text-stone-500">
          Pick your service area — we&apos;ll show you the services partners offer there.
        </p>
      </div>

      <div className="px-5 py-3 shrink-0">
        <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
          <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search your city or area"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none text-stone-800 bg-transparent"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
          </div>
        )}
        {!loading && error && <p className="text-sm text-red-500 py-6 text-center">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-stone-400 py-6 text-center">No service areas found.</p>
        )}
        {filtered.map((zone) => {
          const active = selectedZoneId === zone.id;
          return (
            <label
              key={zone.id}
              className="flex items-center justify-between py-3.5 border-b border-stone-100 cursor-pointer active:bg-stone-50"
            >
              <div className="min-w-0">
                <span className="text-sm text-stone-700 block truncate">{zone.city}</span>
                {zone.name !== zone.city && (
                  <span className="text-[11px] text-stone-400">{zone.name}</span>
                )}
              </div>
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  active ? "border-amber-500 bg-amber-500" : "border-stone-300"
                }`}
              >
                {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <input
                type="radio"
                name="service-area"
                checked={active}
                onChange={() => onSelect(zone)}
                className="hidden"
              />
            </label>
          );
        })}
      </div>

      <div className="px-5 pb-8 pt-3 shrink-0">
        <button
          onClick={onContinue}
          disabled={!selectedZoneId}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] ${
            selectedZoneId
              ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
