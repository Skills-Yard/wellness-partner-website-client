import React from "react";
import { ArrowLeft, User, Building2, Loader2, Check } from "lucide-react";
import type { PartnerType } from "@/lib/api/types";

interface PartnerTypeStepProps {
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

export default function PartnerTypeStep({
  value,
  onChange,
  onBack,
  onContinue,
  loading,
  error,
}: PartnerTypeStepProps) {
  return (
    <div className="flex flex-col flex-1 bg-white animate-in fade-in duration-300">
      <div className="px-4 pt-5 pb-2 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-stone-700" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 flex flex-col">
        <h2 className="text-[22px] font-extrabold text-stone-900 mb-2 leading-snug">
          How do you want to <span className="underline decoration-2 underline-offset-2">work with us?</span>
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          This decides how your KYC and team is set up — choose carefully, it can&apos;t be changed later.
        </p>

        <div className="space-y-3">
          {OPTIONS.map((opt) => {
            const active = value === opt.type;
            return (
              <button
                key={opt.type}
                onClick={() => onChange(opt.type)}
                className={`w-full text-left flex items-start gap-4 rounded-2xl border-2 px-4 py-4 transition-all cursor-pointer ${
                  active
                    ? "border-amber-500 bg-amber-50/60 shadow-sm"
                    : "border-stone-200 bg-[#F9F6F0] hover:border-stone-300"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? "bg-amber-500 text-white" : "bg-white text-stone-500 border border-stone-200"
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900">{opt.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    active ? "border-amber-500 bg-amber-500" : "border-stone-300"
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="px-5 pb-8 pt-3 shrink-0">
        <button
          onClick={onContinue}
          disabled={!value || loading}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            value && !loading
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
