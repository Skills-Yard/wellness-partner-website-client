'use client';

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { professions } from "@/utils/data/professions";

import CitySelectOverlay from "./CitySelectOverlay";
import WorkSelectOverlay from "./WorkSelectOverlay";
import PhoneStep from "./PhoneStep";
import OtpStep from "./OtpStep";
import OnboardingStep from "./OnboardingStep";
import EarningsPreviewStep from "./EarningsPreviewStep";
import EarningsDetailStep from "./EarningsDetailStep";

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

type AuthStep = "PHONE" | "OTP" | "ONBOARDING" | "EARNINGS_PREVIEW" | "EARNINGS_DETAIL";

function LoginFormContent({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: (data: { city: string; profession: string }) => void;
}) {
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(26);
  const [timerExpired, setTimerExpired] = useState(false);

  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [workHours, setWorkHours] = useState(8);

  const [showCitySelect, setShowCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showWorkSelect, setShowWorkSelect] = useState(false);
  const [workSearch, setWorkSearch] = useState("");

  const [notification, setNotification] = useState({ visible: false, message: "" });

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Phone step logic ───────────────────────────────────────────────────
  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep("OTP");
  };

  // ── OTP step logic ─────────────────────────────────────────────────────
  useEffect(() => {
    let countdown: NodeJS.Timeout;
    let otpTimer: NodeJS.Timeout;

    if (step === "OTP") {
      setTimer(26);
      setTimerExpired(false);
      setOtp(Array(6).fill(""));

      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) { setTimerExpired(true); return 0; }
          return prev - 1;
        });
      }, 1000);

      otpTimer = setTimeout(() => {
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setNotification({ visible: true, message: `Your verification code is ${generatedOtp}` });
        setTimeout(() => {
          setOtp(generatedOtp.split(""));
          setNotification({ visible: false, message: "" });
          setTimeout(() => setStep("ONBOARDING"), 600);
        }, 2000);
      }, 1500);
    }

    return () => { clearTimeout(otpTimer); clearInterval(countdown); };
  }, [step]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) setTimeout(() => setStep("ONBOARDING"), 400);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  // ── Onboarding step logic ──────────────────────────────────────────────
  const handleComplete = () => setStep("EARNINGS_PREVIEW");

  const handleFinalComplete = () => {
    if (onComplete) onComplete({ city, profession });
    else onClose();
    router.push("/");
  };

  const earningMap: Record<number, string> = { 4: "₹27,450", 6: "₹37,200", 8: "₹47,199" };

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid = Boolean(name.trim().length > 0 && !hasSpecialChar && profession && city && agreed);

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );
  const filteredProfessions = professions.filter((p) =>
    p.toLowerCase().includes(workSearch.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      {/* City Select Overlay */}
      {showCitySelect && step === "ONBOARDING" && (
        <CitySelectOverlay
          filteredCities={filteredCities}
          city={city}
          citySearch={citySearch}
          setCitySearch={setCitySearch}
          setCity={setCity}
          onClose={() => setShowCitySelect(false)}
        />
      )}

      {/* Work Select Overlay */}
      {showWorkSelect && step === "ONBOARDING" && (
        <WorkSelectOverlay
          filteredProfessions={filteredProfessions}
          profession={profession}
          workSearch={workSearch}
          setWorkSearch={setWorkSearch}
          setProfession={setProfession}
          onClose={() => setShowWorkSelect(false)}
        />
      )}

      {/* Step 1: Phone */}
      {step === "PHONE" && (
        <PhoneStep
          phone={phone}
          setPhone={setPhone}
          onPhoneSubmit={handlePhoneSubmit}
          onSkip={onClose}
        />
      )}

      {/* Step 2: OTP */}
      {step === "OTP" && (
        <OtpStep
          phone={phone}
          otp={otp}
          timer={timer}
          timerExpired={timerExpired}
          otpRefs={otpRefs}
          handleOtpChange={handleOtpChange}
          handleOtpKeyDown={handleOtpKeyDown}
          onBack={() => setStep("PHONE")}
          onResend={() => setStep("OTP")}
        />
      )}

      {/* Step 3: Onboarding */}
      {step === "ONBOARDING" && (
        <OnboardingStep
          name={name}
          setName={setName}
          profession={profession}
          city={city}
          agreed={agreed}
          setAgreed={setAgreed}
          hasSpecialChar={hasSpecialChar}
          isFormValid={isFormValid}
          onBack={() => setStep("OTP")}
          onOpenWorkSelect={() => setShowWorkSelect(true)}
          onOpenCitySelect={() => setShowCitySelect(true)}
          onComplete={handleComplete}
        />
      )}

      {/* Step 4: Earnings Preview */}
      {step === "EARNINGS_PREVIEW" && (
        <EarningsPreviewStep onNext={() => setStep("EARNINGS_DETAIL")} />
      )}

      {/* Step 5: Earnings Detail */}
      {step === "EARNINGS_DETAIL" && (
        <EarningsDetailStep
          workHours={workHours}
          setWorkHours={setWorkHours}
          earningMap={earningMap}
          onBack={() => setStep("EARNINGS_PREVIEW")}
          onFinalComplete={handleFinalComplete}
        />
      )}

      {/* Floating Notification */}
      <div
        className={`absolute left-1/2 z-[60] w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-stone-900 p-3.5 text-white shadow-2xl transition-all duration-500 ${
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

export default function LoginForm({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: (data: { city: string; profession: string }) => void;
}) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile === null) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
        <LoginFormContent onClose={onClose} onComplete={onComplete} />
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="flex flex-col p-0 overflow-hidden bg-white border border-stone-100 shadow-2xl gap-0 outline-none animate-in fade-in duration-200"
        style={{
          width: "390px",
          height: "min(844px, 92vh)",
          borderRadius: "38px",
          maxWidth: "390px",
        }}
        showCloseButton={false}
      >
        <h2 className="sr-only">Authentication Flow</h2>
        <LoginFormContent onClose={onClose} onComplete={onComplete} />
      </DialogContent>
    </Dialog>
  );
}
