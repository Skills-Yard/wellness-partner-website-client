"use client";

import React, { useEffect } from "react";
import { Timer, RotateCcw, Loader2 } from "lucide-react";
import { DesktopStepCard, DesktopPrimaryButton, DesktopStepFooter } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";

interface DesktopOtpStepProps {
  phone: string;
  otp: string[];
  timer: number;
  timerExpired: boolean;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onResend: () => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
  devOtp?: string | null;
}

export default function DesktopOtpStep({
  phone,
  otp,
  timer,
  timerExpired,
  otpRefs,
  handleOtpChange,
  handleOtpKeyDown,
  onBack,
  onResend,
  onSubmit,
  loading,
  error,
  devOtp,
}: DesktopOtpStepProps) {
  const { setActiveStep } = useOnboardingWizardStep();
  useEffect(() => setActiveStep("login"), [setActiveStep]);

  return (
    <DesktopStepCard title="Verify your mobile number" subtitle={`Enter the 6-digit OTP sent to +91 ${phone}`} error={error}>
      <div className="flex items-center justify-center gap-2.5 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              otpRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={loading}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            className={`h-14 w-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-white cursor-text disabled:opacity-60 ${
              digit !== "" ? "border-stone-700 text-stone-900" : "border-stone-200 text-transparent"
            } focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20`}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm font-medium mb-6">
        {loading ? (
          <span className="flex items-center gap-2 text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
          </span>
        ) : !timerExpired ? (
          <span className="flex items-center gap-1.5 text-stone-500">
            <Timer className="h-4 w-4 text-stone-400" />
            Resend OTP in <span className="font-bold text-[#C9851A]">00:{timer < 10 ? `0${timer}` : timer}</span>
          </span>
        ) : (
          <button
            onClick={onResend}
            className="flex items-center gap-1.5 text-[#C9851A] font-semibold hover:text-[#B67714] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Resend code
          </button>
        )}
      </div>

      {devOtp && (
        <p className="text-center text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-full mb-4">
          Dev mode — your code is {devOtp}
        </p>
      )}

      <DesktopPrimaryButton onClick={onSubmit} disabled={otp.some((d) => d === "")} loading={loading}>
        Verify &amp; Continue
      </DesktopPrimaryButton>

      <DesktopStepFooter onBack={onBack} />
    </DesktopStepCard>
  );
}
