"use client";

import React, { useEffect } from "react";
import { User, Building2, Check } from "lucide-react";
import { DesktopStepCard, DesktopPrimaryButton, DesktopStepFooter } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";
import type { PartnerType } from "@/lib/api/types";

interface DesktopPartnerTypeStepProps {
  value: PartnerType | null;
  onChange: (type: PartnerType) => void;
  onBack: () => void;
  onContinue: () => void;
  loading?: boolean;
  error?: string | null;
}

const OPTIONS: { type: PartnerType; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: "INDIVIDUAL",
    title: "Individual",
    desc: "I work on my own and provide services myself.",
    icon: <User className="h-6 w-6" />,
  },
  {
    type: "BUSINESS",
    title: "Business",
    desc: "I run a business/team and manage staff who provide services.",
    icon: <Building2 className="h-6 w-6" />,
  },
];

export default function DesktopPartnerTypeStep({
  value,
  onChange,
  onBack,
  onContinue,
  loading,
  error,
}: DesktopPartnerTypeStepProps) {
  const { setActiveStep } = useOnboardingWizardStep();
  useEffect(() => setActiveStep("login"), [setActiveStep]);

  return (
    <DesktopStepCard title="How do you want to work with us?" subtitle="This decides how your KYC and team is set up — choose carefully, it can't be changed later." error={error}>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {OPTIONS.map((opt) => {
          const active = value === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => onChange(opt.type)}
              className={`text-left flex flex-col gap-3 rounded-2xl border-2 px-5 py-5 transition-all cursor-pointer ${
                active ? "border-[#C9851A] bg-[#FFF8EC] shadow-sm" : "border-stone-200 bg-[#F9F6F0] hover:border-stone-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    active ? "bg-[#C9851A] text-white" : "bg-white text-stone-500 border border-stone-200"
                  }`}
                >
                  {opt.icon}
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    active ? "border-[#C9851A] bg-[#C9851A]" : "border-stone-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">{opt.title}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <DesktopPrimaryButton onClick={onContinue} disabled={!value} loading={loading}>
        Continue
      </DesktopPrimaryButton>

      <DesktopStepFooter onBack={onBack} />
    </DesktopStepCard>
  );
}
