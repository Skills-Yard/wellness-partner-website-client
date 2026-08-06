"use client";

import React, { useEffect, useState } from "react";
import CitySelectOverlay from "./CitySelectOverlay";
import ServiceSelectOverlay from "./ServiceSelectOverlay";
import OnboardingStep from "./OnboardingStep";
import EarningsPreviewStep from "./EarningsPreviewStep";
import EarningsDetailStep from "./EarningsDetailStep";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import * as partnerApi from "@/lib/api/partner";
import * as onboardingApi from "@/lib/api/onboarding";
import * as catalogApi from "@/lib/api/catalog";
import type { ServiceCategory, ServiceItem } from "@/lib/api/types";

const cities = [
  "Delhi NCR",
  "Mumbai",
  "Bangalore",
  "Noida",
  "Gurugram",
  "Kolkata",
  "Chennai",
  "Hyderabad",
  "Pune",
];

type Step = "PROFILE_SERVICES" | "EARNINGS_PREVIEW" | "EARNINGS_DETAIL";

/**
 * status === INCOMPLETE, onboardingStep < 2: name + services + city, then a
 * couple of non-skippable "why partner with us" marketing screens before
 * KYC. Submitting here always advances onboardingStep to 2 on the backend
 * (see PartnerService.setServices), so a reload lands straight on KYC.
 *
 * "What services do you offer?" is answered at the ServiceCategory level
 * (Spa, Salon, etc.) rather than picking individual ServiceItem SKUs — a
 * selected category is expanded into every ServiceItem under it before
 * calling POST /partner/onboarding/services, since that's the granularity
 * PartnerService actually links against.
 */
export default function ProfileSetupFlow() {
  const { partner, refreshProfile, logout } = useAuth();

  const [step, setStep] = useState<Step>("PROFILE_SERVICES");
  const [name, setName] = useState(partner?.name ?? "");
  const [city, setCity] = useState(partner?.city ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [workHours, setWorkHours] = useState(8);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([catalogApi.getCategories(), catalogApi.getServiceItems()])
      .then(([cats, serviceItems]) => {
        setCategories(cats);
        setItems(serviceItems);

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
  }, []);

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid = Boolean(
    name.trim().length > 0 && !hasSpecialChar && selectedCategoryIds.length > 0 && city && agreed
  );

  const filteredCities = cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!isFormValid || submitLoading) return;
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

      await partnerApi.updateProfile({ name: name.trim(), city });
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
      {showCitySelect && step === "PROFILE_SERVICES" && (
        <CitySelectOverlay
          filteredCities={filteredCities}
          city={city}
          citySearch={citySearch}
          setCitySearch={setCitySearch}
          setCity={setCity}
          onClose={() => setShowCitySelect(false)}
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
          city={city}
          agreed={agreed}
          setAgreed={setAgreed}
          hasSpecialChar={hasSpecialChar}
          isFormValid={isFormValid}
          onBack={() => logout()}
          onOpenServiceSelect={() => setShowServiceSelect(true)}
          onOpenCitySelect={() => setShowCitySelect(true)}
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
    </div>
  );
}
