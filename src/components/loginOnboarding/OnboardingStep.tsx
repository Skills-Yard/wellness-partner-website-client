import React from "react";
import { ArrowLeft, ChevronDown, Loader2, MapPin } from "lucide-react";
import type { ServiceCategory } from "@/lib/api/types";

interface OnboardingStepProps {
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
  onComplete: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function OnboardingStep({
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
  onComplete,
  loading,
  error,
}: OnboardingStepProps) {
  const selectedLabel = selectedCategoryIds.length
    ? categories
        .filter((c) => selectedCategoryIds.includes(c.id))
        .map((c) => c.title || c.name)
        .join(", ")
    : "";

  return (
    <div className="flex flex-col flex-1 bg-white animate-in fade-in duration-300">
      {/* Top bar: back arrow + English button */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-stone-700" />
        </button>
        <button className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors cursor-pointer">
          English
          <span className="text-base leading-none">Aअ</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 flex flex-col">
        {/* Heading */}
        <h2 className="text-[22px] font-extrabold text-stone-900 mb-2 leading-snug">
          Tell us about{" "}
          <span className="underline decoration-2 underline-offset-2">yourself!</span>
        </h2>

        {city && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-6">
            <MapPin className="h-3.5 w-3.5 text-[#C9851A]" />
            Serving {city}
          </div>
        )}

        <div className="space-y-5 flex-1">
          {/* Name */}
          <div>
            <p className="text-sm font-bold text-stone-800 mb-2">
              What&apos;s your name?
            </p>
            <div
              className={`rounded-xl border px-4 py-3.5 bg-[#F9F6F0] focus-within:bg-white focus-within:border-amber-500 transition-all ${
                hasSpecialChar
                  ? "border-red-400"
                  : name
                  ? "border-stone-300"
                  : "border-stone-200"
              }`}
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
                autoFocus
              />
            </div>
            <p className="mt-1.5 ml-0.5 text-[11px] text-[#C9851A] font-medium opacity-85">
              Special Characters like !@#$%^&amp;*()_-+=, are not allowed
            </p>
          </div>

          {/* Services offered */}
          <div>
            <p className="text-sm font-bold text-stone-850 mb-2">
              What services do you offer?
            </p>
            <div
              onClick={onOpenServiceSelect}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#F9F6F0] hover:bg-white hover:border-amber-400 px-4 py-3.5 cursor-pointer transition-all"
            >
              <span
                className={`text-sm truncate ${
                  selectedCategoryIds.length ? "text-stone-900 font-medium" : "text-stone-400"
                }`}
              >
                {categoriesLoading
                  ? "Loading services available in your area…"
                  : selectedLabel || "Select the services you provide"}
              </span>
              <ChevronDown className="h-4 w-4 text-stone-400 shrink-0 ml-2" />
            </div>
          </div>
        </div>

        {/* T&C checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mt-6">
          <div
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
              agreed ? "border-stone-900 bg-stone-900" : "border-stone-400"
            }`}
            onClick={() => setAgreed(!agreed)}
          >
            {agreed && (
              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            By proceeding, you agree to Vellora&apos;s{" "}
            <span className="underline font-semibold text-stone-700">
              Terms &amp; conditions
            </span>{" "}
            and{" "}
            <span className="underline font-semibold text-stone-700">
              Privacy policy
            </span>
          </p>
        </label>

        {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
      </div>

      {/* Sticky Continue button */}
      <div className="px-5 pb-8 pt-3 shrink-0">
        <button
          onClick={onComplete}
          disabled={!isFormValid || loading}
          id="onboarding-continue-btn"
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            isFormValid && !loading
              ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
        </button>
      </div>
    </div>
  );
}
