"use client";

import React, { useEffect } from "react";
import { Plus } from "lucide-react";
import { DesktopStepCard, DesktopPrimaryButton, DesktopStepFooter } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";
import type { ServiceCategory } from "@/lib/api/types";

interface DesktopPartnerDetailsStepProps {
  name: string;
  setName: (value: string) => void;
  selectedCategoryIds: string[];
  categories: ServiceCategory[];
  categoriesLoading: boolean;
  city: string;
  agreed: boolean;
  setAgreed: (value: boolean) => void;
  hasSpecialChar: boolean;
  isFormValid: boolean;
  onBack: () => void;
  onOpenServiceSelect: () => void;
  onToggleCategory: (id: string) => void;
  onComplete: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function DesktopPartnerDetailsStep({
  name,
  setName,
  selectedCategoryIds,
  categories,
  categoriesLoading,
  city,
  agreed,
  setAgreed,
  hasSpecialChar,
  isFormValid,
  onBack,
  onOpenServiceSelect,
  onToggleCategory,
  onComplete,
  loading,
  error,
}: DesktopPartnerDetailsStepProps) {
  const { setActiveStep } = useOnboardingWizardStep();
  useEffect(() => setActiveStep("partner_details"), [setActiveStep]);

  const selectedCategories = categories.filter((c) => selectedCategoryIds.includes(c.id));

  return (
    <DesktopStepCard
      title="Tell us about yourself"
      subtitle={city ? `Enter your name and select your service type — serving ${city}` : "Enter your name and select your service type"}
      error={error}
    >
      <p className="text-xs font-bold text-stone-700 mb-1.5">Full Name</p>
      <div
        className={`rounded-xl border px-4 py-3 bg-[#F9F6F0] focus-within:bg-white focus-within:border-amber-500 transition-all mb-1.5 ${
          hasSpecialChar ? "border-red-400" : "border-stone-200"
        }`}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          autoFocus
          className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
        />
      </div>
      {hasSpecialChar && (
        <p className="text-[11px] text-red-500 font-medium mb-4">Special characters like !@#$%^&amp;*()_-+= aren&apos;t allowed.</p>
      )}
      {!hasSpecialChar && <div className="mb-4" />}

      <p className="text-xs font-bold text-stone-700 mb-2">Service Type</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {categoriesLoading && <span className="text-xs text-stone-400 py-2">Loading services available in your area…</span>}
        {!categoriesLoading &&
          selectedCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => onToggleCategory(c.id)}
              className="flex items-center gap-1.5 rounded-full border border-[#C9851A] bg-[#FFF8EC] px-3.5 py-1.5 text-xs font-bold text-[#C9851A] cursor-pointer"
            >
              {c.title || c.name}
              <span aria-hidden>✕</span>
            </button>
          ))}
        {!categoriesLoading && (
          <button
            onClick={onOpenServiceSelect}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-stone-300 px-3.5 py-1.5 text-xs font-bold text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {selectedCategories.length === 0 ? "Select services" : "Add more"}
          </button>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-7">
        <div
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
            agreed ? "border-stone-900 bg-stone-900" : "border-stone-400"
          }`}
          onClick={() => setAgreed(!agreed)}
        >
          {agreed && (
            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed">
          By proceeding, you agree to Eezit&apos;s <span className="underline font-semibold text-stone-700">Terms &amp; Conditions</span> and{" "}
          <span className="underline font-semibold text-stone-700">Privacy Policy</span>
        </p>
      </label>

      <DesktopPrimaryButton onClick={onComplete} disabled={!isFormValid} loading={loading}>
        Continue
      </DesktopPrimaryButton>

      <DesktopStepFooter onBack={onBack} />
    </DesktopStepCard>
  );
}
