import React from "react";
import { ArrowLeft, Timer, RotateCcw } from "lucide-react";
import { OtpIconIllustration } from "./illustrations";

interface OtpStepProps {
  phone: string;
  otp: string[];
  timer: number;
  timerExpired: boolean;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onResend: () => void;
}

export default function OtpStep({
  phone,
  otp,
  timer,
  timerExpired,
  otpRefs,
  handleOtpChange,
  handleOtpKeyDown,
  onBack,
  onResend,
}: OtpStepProps) {
  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-300">
      {/* Back arrow */}
      <div className="px-5 pt-5">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-stone-700" />
        </button>
      </div>

      {/* Centred content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <OtpIconIllustration />

        <h1 className="text-[22px] md:text-xl font-bold text-stone-900 leading-tight mb-2">
          Enter verification code
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-[290px]">
          A 6-digit verification code has been sent on{" "}
          <span className="font-semibold text-stone-700">+91 {phone}</span>
        </p>

        {/* 6 OTP boxes */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
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
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              id={`otp-input-${index}`}
              className={`h-12 w-10 sm:h-14 sm:w-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-white cursor-text ${
                digit !== ""
                  ? "border-stone-700 text-stone-900"
                  : "border-stone-200 text-transparent"
              } focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20`}
            />
          ))}
        </div>

        {/* Resend timer / button */}
        <div className="flex items-center gap-2 text-sm font-medium">
          {!timerExpired ? (
            <>
              <Timer className="h-4 w-4 text-stone-400" />
              <span className="text-stone-500">
                Resent code in{" "}
                <span className="text-amber-500 font-bold">
                  00:{timer < 10 ? `0${timer}` : timer}
                </span>
              </span>
            </>
          ) : (
            <button
              onClick={onResend}
              className="flex items-center gap-1.5 text-amber-500 font-semibold hover:text-amber-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Resend code
            </button>
          )}
        </div>

        {/* Auto-fill indicator */}
        <div className="mt-5 flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-full animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Auto-filling mock verification code…</span>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="pb-10" />
    </div>
  );
}
