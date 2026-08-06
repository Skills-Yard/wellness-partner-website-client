import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { PhoneIconIllustration } from "./illustrations";

interface PhoneStepProps {
  phone: string;
  setPhone: (value: string) => void;
  onPhoneSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function PhoneStep({
  phone,
  setPhone,
  onPhoneSubmit,
  loading,
  error,
}: PhoneStepProps) {
  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-300">
      {/* Centred content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-10">
        <PhoneIconIllustration />

        <h1 className="text-[22px] md:text-xl font-bold text-stone-900 leading-tight mb-2">
          Enter your phone number
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-[280px]">
          We&apos;ll send you a text with verification code. Standard tariff may apply.
        </p>

        {/* +91 | number input */}
        <div className="w-full max-w-[320px] flex rounded-xl border border-stone-200 bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 overflow-hidden transition-all shadow-sm">
          <div className="flex items-center gap-1 border-r border-stone-200 px-3 py-3 bg-stone-50 shrink-0 select-none">
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
            className="flex-1 px-3 py-3 text-sm text-stone-900 outline-none font-medium bg-transparent placeholder:text-stone-300"
            placeholder="Enter phone number"
          />
        </div>

        {error && (
          <p className="mt-3 text-xs font-medium text-red-500 max-w-[300px]">{error}</p>
        )}
      </div>

      {/* Bottom: T&C + Continue button */}
      <div className="px-6 pb-8 pt-4">
        <p className="text-xs text-stone-400 text-center mb-4">
          By continuing, you agree to our{" "}
          <span className="underline font-semibold text-stone-600 cursor-pointer">T&amp;C</span>{" "}
          and{" "}
          <span className="underline font-semibold text-stone-600 cursor-pointer">Privacy policy</span>
        </p>
        <button
          onClick={onPhoneSubmit}
          disabled={phone.length < 10 || loading}
          id="phone-continue-btn"
          className={`w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            phone.length >= 10 && !loading
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
