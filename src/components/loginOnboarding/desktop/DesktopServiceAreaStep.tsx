"use client";

import React, { useEffect, useState } from "react";
import { Loader2, LocateFixed, CheckCircle2, AlertTriangle } from "lucide-react";
import { DesktopStepCard, DesktopPrimaryButton } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";
import type { ResolvedArea } from "../ServiceAreaStep";

interface DesktopServiceAreaStepProps {
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

/** Same lat/lon -> zone resolution as the mobile ServiceAreaStep — see its
 *  own comment for why a coordinate rather than a place picker. */
export default function DesktopServiceAreaStep({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  resolving,
  error,
  resolvedArea,
  onResolve,
  onContinue,
}: DesktopServiceAreaStepProps) {
  const { setActiveStep } = useOnboardingWizardStep();
  useEffect(() => setActiveStep("work_location"), [setActiveStep]);

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

  const isResolvedForCurrentInput = resolvedArea && resolvedArea.latitude === lat && resolvedArea.longitude === lon;

  return (
    <DesktopStepCard title="Tell us about your work" subtitle="Share your location so we can match you to your service area.">
      <button
        onClick={useCurrentLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-[#C9851A] hover:bg-amber-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 mb-4"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        Use my current location
      </button>

      {geoError && <p className="text-xs font-medium text-red-500 mb-4">{geoError}</p>}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Latitude</p>
          <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 28.7451"
              className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Longitude</p>
          <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 77.1978"
              className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      {isResolvedForCurrentInput && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 mb-6">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-semibold text-green-700">We service {resolvedArea.city}! We will show you opportunities in this area.</span>
        </div>
      )}
      {error && !isResolvedForCurrentInput && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-red-600">{error}</span>
        </div>
      )}
      {!isResolvedForCurrentInput && !error && <div className="mb-2" />}

      <DesktopPrimaryButton
        onClick={isResolvedForCurrentInput ? onContinue : onResolve}
        disabled={!coordsValid}
        loading={resolving}
      >
        {isResolvedForCurrentInput ? "Continue" : "Find my service area"}
      </DesktopPrimaryButton>
    </DesktopStepCard>
  );
}
