"use client";

import React, { useEffect, useState } from "react";
import ServiceAreaStep from "./ServiceAreaStep";
import ServiceSelectOverlay from "./ServiceSelectOverlay";
import OnboardingStep from "./OnboardingStep";
import EarningsPreviewStep from "./EarningsPreviewStep";
import EarningsDetailStep from "./EarningsDetailStep";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import * as partnerApi from "@/lib/api/partner";
import * as onboardingApi from "@/lib/api/onboarding";
import * as catalogApi from "@/lib/api/catalog";
import * as zonesApi from "@/lib/api/zones";
import type { ServiceableZone, ServiceCategory, ServiceItem } from "@/lib/api/types";

type Step = "SERVICE_AREA" | "PROFILE_SERVICES" | "EARNINGS_PREVIEW" | "EARNINGS_DETAIL";

/**
 * status === INCOMPLETE, onboardingStep < 2. Order matters here: the
 * partner's service area is asked FIRST, because "what services do you
 * offer?" is answered from a catalog scoped to that area (x-zone-id) —
 * ServiceItem availability is zone-specific (ZoneServiceItemConfig), so
 * fetching it without a resolved zone would show a global, often-irrelevant
 * catalog. Then a couple of non-skippable "why partner with us" marketing
 * screens before KYC.
 *
 * "What services do you offer?" is answered at the ServiceCategory level
 * (Spa, Salon, etc.) — a selected category is expanded into every
 * ServiceItem under it (within the chosen zone) before calling
 * POST /partner/onboarding/services, since that's the granularity
 * PartnerService actually links against.
 */
export default function ProfileSetupFlow() {
  const { partner, refreshProfile, logout } = useAuth();

  const [step, setStep] = useState<Step>("SERVICE_AREA");

  // Service area
  const [zones, setZones] = useState<ServiceableZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [zoneSearch, setZoneSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState<ServiceableZone | null>(null);

  // Profile + services
  const [name, setName] = useState(partner?.name ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [workHours, setWorkHours] = useState(8);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load service areas up front; if the partner already has a city on file
  // (resuming onboarding), try to match it to a zone and skip straight to
  // the services step instead of re-asking.
  useEffect(() => {
    zonesApi
      .listZones()
      .then((list) => {
        setZones(list);
        if (partner?.city) {
          const match = list.find(
            (z) => z.city.toLowerCase() === partner.city!.toLowerCase()
          );
          if (match) {
            setSelectedZone(match);
            setStep("PROFILE_SERVICES");
          }
        }
      })
      .catch(() => setZonesError("Could not load service areas. Please try again."))
      .finally(() => setZonesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once a zone is chosen, fetch the catalog scoped to it and derive the
  // category picker from whatever ServiceItems are actually available there.
  useEffect(() => {
    if (!selectedZone) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-selection, not a render-loop hazard
    setCatalogLoading(true);
    catalogApi
      .getServiceItems(selectedZone.id)
      .then((serviceItems) => {
        setItems(serviceItems);
        const byId = new Map<string, ServiceCategory>();
        serviceItems.forEach((item) => {
          const cat = item.category?.category;
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
              .map((item) => item.category?.category?.id)
              .filter((id): id is string => Boolean(id))
          );
          setSelectedCategoryIds(Array.from(categoryIds));
        }
      })
      .catch(() => {
        setCategories([]);
        setItems([]);
      })
      .finally(() => setCatalogLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

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
    if (!isFormValid || submitLoading || !selectedZone) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const serviceItemIds = items
        .filter((item) => selectedCategoryIds.includes(item.category?.category?.id))
        .map((item) => item.id);

      if (serviceItemIds.length === 0) {
        setSubmitError("We couldn't find any services under the categories you picked. Please choose different ones.");
        return;
      }

      await partnerApi.updateProfile({ name: name.trim(), city: selectedZone.city });
      await onboardingApi.setServices(serviceItemIds);
      setStep("EARNINGS_PREVIEW");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Could not save your details. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const earningMap: Record<number, string> = { 4: "₹27,450", 6: "₹37,200", 8: "₹47,199" };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {step === "SERVICE_AREA" && (
        <ServiceAreaStep
          zones={zones}
          loading={zonesLoading}
          error={zonesError}
          selectedZoneId={selectedZone?.id ?? null}
          onSelect={setSelectedZone}
          search={zoneSearch}
          setSearch={setZoneSearch}
          onContinue={() => setStep("PROFILE_SERVICES")}
        />
      )}

      {showServiceSelect && step === "PROFILE_SERVICES" && (
        <ServiceSelectOverlay
          categories={categories}
          loading={catalogLoading}
          selectedIds={selectedCategoryIds}
          onToggle={toggleCategory}
          search={serviceSearch}
          setSearch={setServiceSearch}
          onClose={() => setShowServiceSelect(false)}
        />
      )}

      {step === "PROFILE_SERVICES" && (
        <OnboardingStep
          name={name}
          setName={setName}
          selectedCategoryIds={selectedCategoryIds}
          categories={categories}
          categoriesLoading={catalogLoading}
          city={selectedZone?.city ?? ""}
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
      )}

      {step === "EARNINGS_PREVIEW" && <EarningsPreviewStep onNext={() => setStep("EARNINGS_DETAIL")} />}

      {step === "EARNINGS_DETAIL" && (
        <EarningsDetailStep
          workHours={workHours}
          setWorkHours={setWorkHours}
          earningMap={earningMap}
          onBack={() => setStep("EARNINGS_PREVIEW")}
          onFinalComplete={() => refreshProfile()}
        />
      )}

      {step === "SERVICE_AREA" && (
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
