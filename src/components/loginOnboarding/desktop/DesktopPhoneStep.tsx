"use client";

import React, { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { DesktopStepCard, DesktopPrimaryButton } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";

interface DesktopPhoneStepProps {
  phone: string;
  setPhone: (value: string) => void;
  onPhoneSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function DesktopPhoneStep({ phone, setPhone, onPhoneSubmit, loading, error }: DesktopPhoneStepProps) {
  const { setActiveStep } = useOnboardingWizardStep();
  useEffect(() => setActiveStep("login"), [setActiveStep]);

  return (
    <DesktopStepCard title="Welcome to Eezit Partner" subtitle="Enter your mobile number to get started" error={error}>
      <p className="text-xs font-bold text-stone-700 mb-1.5">Mobile Number</p>
      <div className="flex rounded-xl border border-stone-200 bg-white overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all mb-6">
        <div className="flex items-center gap-1.5 border-r border-stone-200 px-3 py-3 bg-stone-50 shrink-0 select-none">
          <span aria-hidden>🇮🇳</span>
          <span className="text-sm text-stone-700 font-semibold">+91</span>
          <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
        </div>
        <input
          type="tel"
          maxLength={10}
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && !loading && onPhoneSubmit()}
          placeholder="98765 43210"
          className="flex-1 px-3 py-3 text-sm text-stone-900 outline-none bg-transparent placeholder:text-stone-300"
        />
      </div>

      <DesktopPrimaryButton onClick={onPhoneSubmit} disabled={phone.length < 10} loading={loading}>
        Send OTP
      </DesktopPrimaryButton>

      <p className="text-xs text-stone-400 text-center mt-4">
        By continuing, you agree to our{" "}
        <span className="underline font-semibold text-stone-600 cursor-pointer">Terms &amp; Conditions</span> and{" "}
        <span className="underline font-semibold text-stone-600 cursor-pointer">Privacy Policy</span>
      </p>
    </DesktopStepCard>
  );
}
