"use client";

import React, { useEffect, useState } from "react";
import ServiceAreaStep, { type ResolvedArea } from "./ServiceAreaStep";
import ServiceSelectOverlay from "./ServiceSelectOverlay";
import OnboardingStep from "./OnboardingStep";
import DesktopServiceAreaStep from "./desktop/DesktopServiceAreaStep";
import DesktopPartnerDetailsStep from "./desktop/DesktopPartnerDetailsStep";
import DesktopServiceSelectOverlay from "./desktop/DesktopServiceSelectOverlay";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import * as partnerApi from "@/lib/api/partner";
import * as onboardingApi from "@/lib/api/onboarding";
import * as catalogApi from "@/lib/api/catalog";
import * as zonesApi from "@/lib/api/zones";
import type { ServiceCategory } from "@/lib/api/types";

type Step = "SERVICE_AREA" | "PROFILE_SERVICES";

/**
 * status === INCOMPLETE, onboardingStep < 2. Order matters here: the
 * partner's service area is asked FIRST, because "what services do you
 * offer?" is answered from a catalog scoped to that area (x-zone-id) —
 * ServiceItem availability is zone-specific (ZoneServiceItemConfig), so
 * fetching it without a resolved zone would show a global, often-irrelevant
 * catalog.
 *
 * The service area itself is resolved from a coordinate (see
 * ServiceAreaStep) rather than picked off a list — GET /zones resolves the
 * OperationalZone whose hex grid contains that point.
 *
 * "What services do you offer?" is answered at the ServiceCategory level
 * (Spa, Salon, etc.) — a selected category is expanded into every
 * ServiceItem under it (within the resolved zone) before calling
 * POST /partner/onboarding/services, since that's the granularity
 * PartnerService actually links against.
 */
export default function ProfileSetupFlow() {
  const { partner, refreshProfile, logout } = useAuth();
  const isDesktop = useIsDesktopViewport();

  const [step, setStep] = useState<Step>("SERVICE_AREA");

  // Service area
  const [latitude, setLatitude] = useState(partner?.latitude != null ? String(partner.latitude) : "");
  const [longitude, setLongitude] = useState(partner?.longitude != null ? String(partner.longitude) : "");
  const [resolvedArea, setResolvedArea] = useState<ResolvedArea | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Profile + services
  const [name, setName] = useState(partner?.name ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resolveArea = async (lat: number, lon: number) => {
    setResolving(true);
    setResolveError(null);
    try {
      const result = await zonesApi.resolveZoneFromCoordinates(lat, lon);
      if (result.exists) {
        setResolvedArea({ zoneId: result.zoneId, city: result.city, latitude: lat, longitude: lon });
      } else {
        setResolvedArea(null);
        setResolveError("We don't currently operate at this location. Try a different spot, or check back later.");
      }
    } catch (err) {
      setResolvedArea(null);
      setResolveError(err instanceof ApiError ? err.message : "Could not check this location. Please try again.");
    } finally {
      setResolving(false);
    }
  };

  // Resume: if the partner already has a location on file (from a previous
  // session), auto-resolve it and skip straight to the services step
  // instead of re-asking.
  useEffect(() => {
    if (partner?.latitude != null && partner?.longitude != null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount resume, not a render-loop hazard
      resolveArea(partner.latitude, partner.longitude).then(() => setStep("PROFILE_SERVICES"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once an area is resolved, fetch the catalog scoped to its zone and
  // derive the category picker from whatever ServiceItems are actually
  // available there.
  useEffect(() => {
    if (!resolvedArea) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-resolution, not a render-loop hazard
    setCatalogLoading(true);
    catalogApi
      .getServiceItems(resolvedArea.zoneId)
      .then((serviceItems) => {
        const byId = new Map<string, ServiceCategory>();
        serviceItems.forEach((item) => {
          const cat = item.subCategory?.category;
          if (cat && !byId.has(cat.id)) byId.set(cat.id, cat);
        });
        setCategories(Array.from(byId.values()));

        // Resume: derive already-selected categories from the partner's
        // existing PartnerService rows (serviceItem -> its top category).
        const existingItemIds = new Set(
          partner?.partnerServices?.map((s) => s.serviceItemId) ?? []
        );
        if (existingItemIds.size > 0) {
          const categoryIds = new Set(
            serviceItems
              .filter((item) => existingItemIds.has(item.id))
              .map((item) => item.subCategory?.category?.id)
              .filter((id): id is string => Boolean(id))
          );
          setSelectedCategoryIds(Array.from(categoryIds));
        }
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => setCatalogLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedArea]);

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid = Boolean(
    name.trim().length > 0 && !hasSpecialChar && selectedCategoryIds.length > 0 && agreed
  );

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!isFormValid || submitLoading || !resolvedArea) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      // PATCH /profile with lat/lon triggers the backend's own zone
      // resolution + city/servingHexes persistence (PartnerService.update),
      // so the partner record ends up with the same area we resolved above.
      await partnerApi.updateProfile({
        name: name.trim(),
        latitude: resolvedArea.latitude,
        longitude: resolvedArea.longitude,
      });
      // The backend expands these categoryIds into the concrete
      // ServiceItems beneath them — a 400 comes back if the selection maps
      // to no active items.
      await onboardingApi.setServicesByCategory(selectedCategoryIds);
      // No more "check your earnings" screens between this and KYC —
      // profile + services are saved above, so this just re-fetches the
      // partner record (onboardingStep flips server-side) and the dashboard
      // hands off to KycFlow next.
      await refreshProfile();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not save your details. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className={isDesktop ? "relative w-full" : "relative flex-1 flex flex-col min-h-0 overflow-hidden"}>
      {step === "SERVICE_AREA" &&
        (isDesktop ? (
          <DesktopServiceAreaStep
            latitude={latitude}
            longitude={longitude}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            resolving={resolving}
            error={resolveError}
            resolvedArea={resolvedArea}
            onResolve={() => resolveArea(parseFloat(latitude), parseFloat(longitude))}
            onContinue={() => setStep("PROFILE_SERVICES")}
          />
        ) : (
          <ServiceAreaStep
            latitude={latitude}
            longitude={longitude}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            resolving={resolving}
            error={resolveError}
            resolvedArea={resolvedArea}
            onResolve={() => resolveArea(parseFloat(latitude), parseFloat(longitude))}
            onContinue={() => setStep("PROFILE_SERVICES")}
          />
        ))}

      {showServiceSelect &&
        step === "PROFILE_SERVICES" &&
        (isDesktop ? (
          <DesktopServiceSelectOverlay
            categories={categories}
            loading={catalogLoading}
            selectedIds={selectedCategoryIds}
            onToggle={toggleCategory}
            search={serviceSearch}
            setSearch={setServiceSearch}
            onClose={() => setShowServiceSelect(false)}
          />
        ) : (
          <ServiceSelectOverlay
            categories={categories}
            loading={catalogLoading}
            selectedIds={selectedCategoryIds}
            onToggle={toggleCategory}
            search={serviceSearch}
            setSearch={setServiceSearch}
            onClose={() => setShowServiceSelect(false)}
          />
        ))}

      {step === "PROFILE_SERVICES" &&
        (isDesktop ? (
          <DesktopPartnerDetailsStep
            name={name}
            setName={setName}
            selectedCategoryIds={selectedCategoryIds}
            categories={categories}
            categoriesLoading={catalogLoading}
            city={resolvedArea?.city ?? ""}
            agreed={agreed}
            setAgreed={setAgreed}
            hasSpecialChar={hasSpecialChar}
            isFormValid={isFormValid}
            onBack={() => setStep("SERVICE_AREA")}
            onOpenServiceSelect={() => setShowServiceSelect(true)}
            onToggleCategory={toggleCategory}
            onComplete={handleComplete}
            loading={submitLoading}
            error={submitError}
          />
        ) : (
          <OnboardingStep
            name={name}
            setName={setName}
            selectedCategoryIds={selectedCategoryIds}
            categories={categories}
            categoriesLoading={catalogLoading}
            city={resolvedArea?.city ?? ""}
            agreed={agreed}
            setAgreed={setAgreed}
            hasSpecialChar={hasSpecialChar}
            isFormValid={isFormValid}
            onBack={() => setStep("SERVICE_AREA")}
            onOpenServiceSelect={() => setShowServiceSelect(true)}
            onComplete={handleComplete}
            loading={submitLoading}
            error={submitError}
          />
        ))}

      {/* Desktop already has its own sign-out link in the wizard sidebar — this is mobile-only */}
      {!isDesktop && step === "SERVICE_AREA" && (
        <button
          onClick={() => logout()}
          className="absolute top-5 right-5 text-[11px] font-semibold text-stone-400 hover:text-stone-600 z-30"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
