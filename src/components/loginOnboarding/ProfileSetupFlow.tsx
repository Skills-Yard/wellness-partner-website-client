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
import type { ServiceItem } from "@/lib/api/types";

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
 */
export default function ProfileSetupFlow() {
  const { partner, refreshProfile, logout } = useAuth();

  const [step, setStep] = useState<Step>("PROFILE_SERVICES");
  const [name, setName] = useState(partner?.name ?? "");
  const [city, setCity] = useState(partner?.city ?? "");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    partner?.partnerServices?.map((s) => s.serviceItemId) ?? []
  );
  const [agreed, setAgreed] = useState(false);
  const [workHours, setWorkHours] = useState(8);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showServiceSelect, setShowServiceSelect] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    catalogApi
      .getServiceItems()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid = Boolean(
    name.trim().length > 0 && !hasSpecialChar && selectedServiceIds.length > 0 && city && agreed
  );

  const filteredCities = cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (!isFormValid || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await partnerApi.updateProfile({ name: name.trim(), city });
      await onboardingApi.setServices(selectedServiceIds);
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
          services={services}
          loading={servicesLoading}
          selectedIds={selectedServiceIds}
          onToggle={toggleService}
          search={serviceSearch}
          setSearch={setServiceSearch}
          onClose={() => setShowServiceSelect(false)}
        />
      )}

      {step === "PROFILE_SERVICES" && (
        <OnboardingStep
          name={name}
          setName={setName}
          selectedServiceIds={selectedServiceIds}
          services={services}
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
