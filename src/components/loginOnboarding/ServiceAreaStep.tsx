import React, { useState } from "react";
import { Loader2, LocateFixed, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ResolvedArea {
  zoneId: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface ServiceAreaStepProps {
  latitude: string;
  longitude: string;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
  resolving: boolean;
  error: string | null;
  resolvedArea: ResolvedArea | null;
  onResolve: () => void;
  onContinue: () => void;
}

/**
 * Asked before "what services do you offer?" — the partner's location is
 * what resolves their service area (zone), which in turn scopes the
 * subsequent services fetch to what's actually operable there (x-zone-id).
 *
 * For now this takes a raw lat/lon (typed in, or filled from the browser's
 * geolocation) — a map-pin picker can replace the input step later without
 * touching the resolution call (zones.resolveZoneFromCoordinates).
 */
export default function ServiceAreaStep({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  resolving,
  error,
  resolvedArea,
  onResolve,
  onContinue,
}: ServiceAreaStepProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Your browser doesn't support location detection. Please enter coordinates manually.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message || "Could not get your location. Please enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const coordsValid =
    latitude.trim() !== "" &&
    longitude.trim() !== "" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  // Once resolved for the currently-entered coordinates, Continue advances;
  // otherwise the button triggers resolution first.
  const isResolvedForCurrentInput =
    resolvedArea && resolvedArea.latitude === lat && resolvedArea.longitude === lon;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white animate-in fade-in duration-300">
      <div className="px-5 pt-6 pb-2 shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-3">
          <MapPin className="h-6 w-6 text-[#C9851A]" />
        </div>
        <h2 className="text-[22px] font-extrabold text-stone-900 mb-1 leading-snug">
          Where will you <span className="underline decoration-2 underline-offset-2">work?</span>
        </h2>
        <p className="text-sm text-stone-500">
          Share your location — we&apos;ll match you to your service area and show you the services partners offer there.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <button
          onClick={useCurrentLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-[#C9851A] hover:bg-amber-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 mb-4"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          Use my current location
        </button>

        {geoError && <p className="text-xs font-medium text-red-500 mb-4">{geoError}</p>}

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <p className="text-xs font-bold text-stone-800 mb-1.5">Latitude</p>
            <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 12.9716"
                className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800 mb-1.5">Longitude</p>
            <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 77.5946"
                className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>

        {isResolvedForCurrentInput && (
          <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 mt-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-xs font-semibold text-green-700">
              We service {resolvedArea.city}!
            </span>
          </div>
        )}

        {error && !isResolvedForCurrentInput && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 mt-3">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-red-600">{error}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-8 pt-3 shrink-0">
        <button
          onClick={isResolvedForCurrentInput ? onContinue : onResolve}
          disabled={!coordsValid || resolving}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            coordsValid && !resolving
              ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}
        >
          {resolving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isResolvedForCurrentInput ? "Continue" : "Find my service area"}
        </button>
      </div>
    </div>
  );
}
