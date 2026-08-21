"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import PhoneStep from "./PhoneStep";
import OtpStep from "./OtpStep";
import PartnerTypeStep from "./PartnerTypeStep";
import DesktopPhoneStep from "./desktop/DesktopPhoneStep";
import DesktopOtpStep from "./desktop/DesktopOtpStep";
import DesktopPartnerTypeStep from "./desktop/DesktopPartnerTypeStep";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import * as partnerApi from "@/lib/api/partner";
import type { PartnerType } from "@/lib/api/types";

type AuthStep = "PHONE" | "OTP" | "PARTNER_TYPE";

const RESEND_SECONDS = 30;

/**
 * The unauthenticated onboarding entry point: phone -> OTP -> (existing
 * partner: done, AuthProvider flips to authenticated and the gate takes
 * over) -> (new partner: pick INDIVIDUAL/BUSINESS -> register -> done).
 * There is no skip anywhere in this flow.
 */
export default function LoginForm() {
  const { login } = useAuth();
  const isDesktop = useIsDesktopViewport();

  const [step, setStep] = useState<AuthStep>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [signupToken, setSignupToken] = useState<string | null>(null);
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);

  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [notification, setNotification] = useState({ visible: false, message: "" });

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startResendTimer = () => {
    setTimer(RESEND_SECONDS);
    setTimerExpired(false);
  };

  useEffect(() => {
    if (step !== "OTP") return;
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [step]);

  const requestOtpForCurrentPhone = async () => {
    const res = await authApi.requestOtp("+91", phone);
    setDevOtp(res.otp ?? null);
    if (res.otp) {
      setNotification({ visible: true, message: `Your verification code is ${res.otp}` });
      setTimeout(() => setNotification({ visible: false, message: "" }), 3000);
    }
  };

  const handlePhoneSubmit = async () => {
    if (phone.length < 10 || phoneLoading) return;
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      await requestOtpForCurrentPhone();
      setOtp(Array(6).fill(""));
      startResendTimer();
      setStep("OTP");
    } catch (err) {
      setPhoneError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResend = async () => {
    if (otpLoading) return;
    setOtpError(null);
    try {
      await requestOtpForCurrentPhone();
      setOtp(Array(6).fill(""));
      startResendTimer();
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Could not resend the code. Please try again.");
    }
  };

  const submitOtp = async (code: string) => {
    if (otpLoading) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const result = await authApi.verifyOtp("+91", phone, code);
      if ("signupToken" in result && result.signupToken) {
        setSignupToken(result.signupToken);
        setStep("PARTNER_TYPE");
      } else if ("accessToken" in result) {
        await login(result);
      }
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) {
      const code = newOtp.join("");
      setTimeout(() => submitOtp(code), 150);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleRegister = async () => {
    if (!signupToken || !partnerType || typeLoading) return;
    setTypeLoading(true);
    setTypeError(null);
    try {
      const result = await partnerApi.registerPartner(signupToken, {
        countryCode: "+91",
        type: partnerType,
      });
      await login(result.tokens, result.partner.newUser);
    } catch (err) {
      setTypeError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setTypeLoading(false);
    }
  };

  return (
    <div className={isDesktop ? "relative w-full" : "relative flex-1 flex flex-col overflow-hidden"}>
      {step === "PHONE" &&
        (isDesktop ? (
          <DesktopPhoneStep phone={phone} setPhone={setPhone} onPhoneSubmit={handlePhoneSubmit} loading={phoneLoading} error={phoneError} />
        ) : (
          <PhoneStep phone={phone} setPhone={setPhone} onPhoneSubmit={handlePhoneSubmit} loading={phoneLoading} error={phoneError} />
        ))}

      {step === "OTP" &&
        (isDesktop ? (
          <DesktopOtpStep
            phone={phone}
            otp={otp}
            timer={timer}
            timerExpired={timerExpired}
            otpRefs={otpRefs}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            onBack={() => setStep("PHONE")}
            onResend={handleResend}
            onSubmit={() => submitOtp(otp.join(""))}
            loading={otpLoading}
            error={otpError}
            devOtp={devOtp}
          />
        ) : (
          <OtpStep
            phone={phone}
            otp={otp}
            timer={timer}
            timerExpired={timerExpired}
            otpRefs={otpRefs}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            onBack={() => setStep("PHONE")}
            onResend={handleResend}
            loading={otpLoading}
            error={otpError}
            devOtp={devOtp}
          />
        ))}

      {step === "PARTNER_TYPE" &&
        (isDesktop ? (
          <DesktopPartnerTypeStep
            value={partnerType}
            onChange={setPartnerType}
            onBack={() => setStep("OTP")}
            onContinue={handleRegister}
            loading={typeLoading}
            error={typeError}
          />
        ) : (
          <PartnerTypeStep
            value={partnerType}
            onChange={setPartnerType}
            onBack={() => setStep("OTP")}
            onContinue={handleRegister}
            loading={typeLoading}
            error={typeError}
          />
        ))}

      {/* Floating Notification */}
      <div
        className={`absolute left-1/2 z-60 w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-stone-900 p-3.5 text-white shadow-2xl transition-all duration-500 ${
          notification.visible ? "bottom-6 opacity-100" : "-bottom-full opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-stone-400">Messages • Now</p>
            <p className="text-xs font-semibold">{notification.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
