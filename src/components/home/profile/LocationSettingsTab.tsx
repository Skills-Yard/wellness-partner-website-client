"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2, LocateFixed, MapPin } from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { Partner } from "@/lib/api/types";

/**
 * Two independent forms, matching the two distinct fields the API actually
 * separates: coordinates go through the dedicated PATCH
 * /partner/profile/location (same lat/lon -> zone-resolution idea as
 * ServiceAreaStep at signup), while city/state/pincode are plain text
 * fields on the general PATCH /partner/profile — there's no reason a
 * partner correcting their pincode should have to touch their GPS point,
 * or vice versa.
 */
export default function LocationSettingsTab({ partner, onSaved }: { partner: Partner; onSaved: () => Promise<void> }) {
  const [latitude, setLatitude] = useState(partner.latitude != null ? String(partner.latitude) : "");
  const [longitude, setLongitude] = useState(partner.longitude != null ? String(partner.longitude) : "");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [savingCoords, setSavingCoords] = useState(false);
  const [coordsError, setCoordsError] = useState<string | null>(null);
  const [coordsSaved, setCoordsSaved] = useState(false);

  const [city, setCity] = useState(partner.city ?? "");
  const [state, setState] = useState(partner.state ?? "");
  const [pincode, setPincode] = useState(partner.pincode ?? "");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);

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

  const handleSaveCoords = async () => {
    if (!coordsValid || savingCoords) return;
    setSavingCoords(true);
    setCoordsError(null);
    setCoordsSaved(false);
    try {
      await partnerApi.updateLocation({ latitude: lat, longitude: lon });
      await onSaved();
      setCoordsSaved(true);
      window.setTimeout(() => setCoordsSaved(false), 2500);
    } catch (err) {
      setCoordsError(
        err instanceof ApiError ? err.message : "Could not update your location. Please try again."
      );
    } finally {
      setSavingCoords(false);
    }
  };

  const handleSaveAddress = async () => {
    if (savingAddress) return;
    setSavingAddress(true);
    setAddressError(null);
    setAddressSaved(false);
    try {
      await partnerApi.updateProfile({ city: city.trim(), state: state.trim(), pincode: pincode.trim() });
      await onSaved();
      setAddressSaved(true);
      window.setTimeout(() => setAddressSaved(false), 2500);
    } catch (err) {
      setAddressError(err instanceof ApiError ? err.message : "Could not save your address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Coordinates */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-stone-900">Coordinates</p>
            <p className="text-xs text-stone-400">Where customers get matched to you from.</p>
          </div>
        </div>

        <button
          onClick={useCurrentLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-bold text-[#C9851A] hover:bg-amber-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 mb-4"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          Use my current location
        </button>

        {geoError && <p className="text-xs font-medium text-red-500 mb-4">{geoError}</p>}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">Latitude</p>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">Longitude</p>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {coordsError && <p className="text-xs font-medium text-red-500 mb-3">{coordsError}</p>}
        {coordsSaved && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-green-600 mb-3">
            <CheckCircle2 className="h-3.5 w-3.5" /> Location updated.
          </p>
        )}

        <button
          onClick={handleSaveCoords}
          disabled={!coordsValid || savingCoords}
          className={`rounded-xl px-6 py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            coordsValid && !savingCoords
              ? "bg-[#C9851A] text-white hover:bg-[#B67714] shadow-md cursor-pointer"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}
        >
          {savingCoords && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Coordinates
        </button>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-stone-900">Address</p>
            <p className="text-xs text-stone-400">Shown on your profile and receipts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">City</p>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">State</p>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">Pincode</p>
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {addressError && <p className="mt-4 text-xs font-medium text-red-500">{addressError}</p>}
        {addressSaved && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Address updated.
          </p>
        )}

        <button
          onClick={handleSaveAddress}
          disabled={savingAddress}
          className="mt-5 rounded-xl px-6 py-2.5 font-bold text-sm bg-[#C9851A] text-white hover:bg-[#B67714] shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {savingAddress && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Address
        </button>
      </div>
    </div>
  );
}
