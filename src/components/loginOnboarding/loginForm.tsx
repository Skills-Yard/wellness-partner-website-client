'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ArrowLeft,
  Search,
  MessageSquare,
  Timer,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { professions } from "@/src/utils/data/professions";


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



// ─── Phone icon illustration (golden phone on warm beige circle) ───────────
function PhoneIconIllustration() {
  return (
    <div className="h-24 w-24 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-6 shadow-sm">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 6C10 5.44772 10.4477 5 11 5H18.3923C18.9715 5 19.4706 5.39765 19.6056 5.96077L21.5056 14.4608C21.6248 14.9645 21.3869 15.484 20.9359 15.7241L17.1641 17.7241C19.3327 22.4895 23.5105 26.6673 28.2759 28.8359L30.2759 25.0641C30.516 24.6131 31.0355 24.3752 31.5392 24.4944L40.0392 26.3944C40.6023 26.5294 41 27.0285 41 27.6077V35C41 35.5523 40.5523 36 40 36H38C22.536 36 10 23.464 10 8V6Z"
          fill="#F5A623"
        />
        <path
          d="M10 6C10 5.44772 10.4477 5 11 5H18.3923C18.9715 5 19.4706 5.39765 19.6056 5.96077L21.5056 14.4608C21.6248 14.9645 21.3869 15.484 20.9359 15.7241L17.1641 17.7241C19.3327 22.4895 23.5105 26.6673 28.2759 28.8359L30.2759 25.0641C30.516 24.6131 31.0355 24.3752 31.5392 24.4944L40.0392 26.3944C40.6023 26.5294 41 27.0285 41 27.6077V35C41 35.5523 40.5523 36 40 36H38C22.536 36 10 23.464 10 8V6Z"
          stroke="#D4891E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ─── Phone + chat bubble illustration for OTP step ─────────────────────────
function OtpIconIllustration() {
  return (
    <div className="h-24 w-24 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-6 shadow-sm">
      <div className="relative">
        {/* Phone body */}
        <svg
          width="34"
          height="44"
          viewBox="0 0 34 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="1.5"
            y="1.5"
            width="31"
            height="41"
            rx="5"
            fill="white"
            stroke="#CCCCCC"
            strokeWidth="1.5"
          />
          <rect x="13" y="37" width="8" height="2.5" rx="1.25" fill="#CCCCCC" />
          <rect x="10" y="7" width="14" height="20" rx="2" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1" />
        </svg>
        {/* Chat bubble */}
        <div className="absolute -top-3 -right-5">
          <div className="bg-amber-400 rounded-xl px-2.5 py-1.5 shadow-md">
            <div className="flex gap-0.5 items-center">
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
              <div className="h-1 w-1 rounded-full bg-white" />
            </div>
          </div>
          <div
            className="ml-2 w-0 h-0"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "6px solid #FBBF24",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Shared inner content ─────────────────────────────────────────────────
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

  // ── Phone step ─────────────────────────────────────────────────────────
  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep("OTP");
  };

  // ── OTP step ───────────────────────────────────────────────────────────
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

  // ── Onboarding step ────────────────────────────────────────────────────
  const handleComplete = () => setStep("EARNINGS_PREVIEW");

  const handleFinalComplete = () => {
    if (onComplete) onComplete({ city, profession });
    else onClose();
    router.push("/");
  };

  // Dynamic earning based on work hours
  const earningMap: Record<number, string> = { 4: "₹27,450", 6: "₹37,200", 8: "₹47,199" };

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid = name.trim().length > 0 && !hasSpecialChar && profession && city && agreed;

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );
  const filteredProfessions = professions.filter((p) =>
    p.toLowerCase().includes(workSearch.toLowerCase())
  );

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">

      {/* ── City Select Overlay ────────────────────────────────────── */}
      {showCitySelect && step === "ONBOARDING" && (
        <div className="absolute inset-0 z-20 flex flex-col bg-white">
          <div className="flex items-center px-4 py-4 border-b border-stone-100">
            <button
              onClick={() => setShowCitySelect(false)}
              className="mr-3 p-1.5 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-stone-700" />
            </button>
            <h2 className="text-sm font-bold text-stone-800">Select City</h2>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
              <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search your city"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full text-sm outline-none text-stone-800 bg-transparent"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredCities.map((c, idx) => (
              <label
                key={idx}
                className="flex items-center justify-between py-3.5 border-b border-stone-100 cursor-pointer active:bg-stone-50"
              >
                <span className="text-sm text-stone-700">{c}</span>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${city === c ? "border-amber-500" : "border-stone-300"
                    }`}
                >
                  {city === c && <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
                </div>
                <input
                  type="radio"
                  name="city"
                  value={c}
                  checked={city === c}
                  onChange={() => { setCity(c); setShowCitySelect(false); }}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Work Select Overlay ────────────────────────────────────── */}
      {showWorkSelect && step === "ONBOARDING" && (
        <div className="absolute inset-0 z-20 flex flex-col bg-white">
          <div className="flex items-center px-4 py-4 border-b border-stone-100">
            <button
              onClick={() => setShowWorkSelect(false)}
              className="mr-3 p-1.5 hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-stone-700" />
            </button>
            <h2 className="text-sm font-bold text-stone-800">Select Profession</h2>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
              <Search className="h-4 w-4 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search profession"
                value={workSearch}
                onChange={(e) => setWorkSearch(e.target.value)}
                className="w-full text-sm outline-none text-stone-800 bg-transparent"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filteredProfessions.map((p, idx) => (
              <label
                key={idx}
                className="flex items-center justify-between py-3.5 border-b border-stone-100 cursor-pointer active:bg-stone-50"
              >
                <span className="text-sm text-stone-700">{p}</span>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${profession === p ? "border-amber-500" : "border-stone-300"
                    }`}
                >
                  {profession === p && <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
                </div>
                <input
                  type="radio"
                  name="profession"
                  value={p}
                  checked={profession === p}
                  onChange={() => { setProfession(p); setShowWorkSelect(false); }}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 1 — PHONE
      ══════════════════════════════════════════════ */}
      {step === "PHONE" && (
        <div className="flex flex-col flex-1 animate-in fade-in duration-300">
          {/* Skip */}
          <div className="flex justify-end px-5 pt-5">
            <button
              onClick={onClose}
              className="rounded-full border border-stone-200 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
            >
              Skip
            </button>
          </div>

          {/* Centred content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <PhoneIconIllustration />

            <h1 className="text-[22px] md:text-xl font-bold text-stone-900 leading-tight mb-2">
              Enter your phone number
            </h1>
            <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-[280px]">
              We&apos;ll send you a text with verification code.{" "}
              Standard tariff may apply.
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
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                className="flex-1 px-3 py-3 text-sm text-stone-900 outline-none font-medium bg-transparent placeholder:text-stone-300"
                placeholder="Enter phone number"
              />
            </div>
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
              onClick={handlePhoneSubmit}
              disabled={phone.length < 10}
              id="phone-continue-btn"
              className={`w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] ${phone.length >= 10
                ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
                }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 2 — OTP
      ══════════════════════════════════════════════ */}
      {step === "OTP" && (
        <div className="flex flex-col flex-1 animate-in fade-in duration-300">
          {/* Back arrow */}
          <div className="px-5 pt-5">
            <button
              onClick={() => setStep("PHONE")}
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
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  id={`otp-input-${index}`}
                  className={`h-12 w-10 sm:h-14 sm:w-12 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all bg-white cursor-text ${digit !== ""
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
                  onClick={() => setStep("OTP")}
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
      )}

      {/* ══════════════════════════════════════════════
          STEP 3 — ONBOARDING
      ══════════════════════════════════════════════ */}
      {step === "ONBOARDING" && (
        <div className="flex flex-col flex-1 bg-white animate-in fade-in duration-300">

          {/* ── Top bar: back arrow + English button ── */}
          <div className="flex items-center justify-between px-4 pt-5 pb-2 shrink-0">
            <button
              onClick={() => setStep("OTP")}
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

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-5 pt-2 pb-4 flex flex-col">

            {/* Heading */}
            <h2 className="text-[22px] font-extrabold text-stone-900 mb-6 leading-snug">
              Tell us about{" "}
              <span className="underline decoration-2 underline-offset-2">yourself!</span>
            </h2>

            <div className="space-y-5 flex-1">

              {/* ── Name ── */}
              <div>
                <p className="text-sm font-bold text-stone-800 mb-2">
                  What&apos;s your name?
                </p>
                <div
                  className={`rounded-xl border px-4 py-3.5 bg-[#F9F6F0] focus-within:bg-white focus-within:border-amber-500 transition-all ${hasSpecialChar ? "border-red-400" : name ? "border-stone-300" : "border-stone-200"
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

              {/* ── Work / Profession ── */}
              <div>
                <p className="text-sm font-bold text-stone-850 mb-2">
                  What work do you do?
                </p>
                <div
                  onClick={() => setShowWorkSelect(true)}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#F9F6F0] hover:bg-white hover:border-amber-400 px-4 py-3.5 cursor-pointer transition-all"
                >
                  <span className={`text-sm ${profession ? "text-stone-900 font-medium" : "text-stone-400"}`}>
                    {profession || "Select work"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                </div>
              </div>

              {/* ── City ── */}
              <div>
                <p className="text-sm font-bold text-stone-850 mb-2">
                  Where do you like?
                </p>
                <div
                  onClick={() => setShowCitySelect(true)}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#F9F6F0] hover:bg-white hover:border-amber-400 px-4 py-3.5 cursor-pointer transition-all"
                >
                  <span className={`text-sm ${city ? "text-stone-900 font-medium" : "text-stone-400"}`}>
                    {city || "Select City"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" />
                </div>
              </div>

            </div>

            {/* ── T&C checkbox ── */}
            <label className="flex items-start gap-3 cursor-pointer mt-6">
              <div
                className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${agreed ? "border-stone-900 bg-stone-900" : "border-stone-400"
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
                By proceeding, you agree to Vellora&apos;s{" "}
                <span className="underline font-semibold text-stone-700">Terms &amp; conditions</span>{" "}
                and{" "}
                <span className="underline font-semibold text-stone-700">Privacy policy</span>
              </p>
            </label>
          </div>

          {/* ── Sticky Continue button ── */}
          <div className="px-5 pb-8 pt-3 shrink-0">
            <button
              onClick={handleComplete}
              disabled={!isFormValid}
              id="onboarding-continue-btn"
              className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] ${isFormValid
                ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
                }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 4 — EARNINGS PREVIEW
      ══════════════════════════════════════════════ */}
      {step === "EARNINGS_PREVIEW" && (
        <div
          className="flex flex-col flex-1 animate-in fade-in duration-300 overflow-y-auto"
          style={{ background: "linear-gradient(179.82deg, #FDF7F2 0.16%, #FFFFFF 121.94%)" }}
        >
          {/* Partner earnings grid image */}
          <div className="flex justify-center px-4 pt-5 pb-2 ">
            <img
              src="/images/wellness-partners.png"
              alt="Vellora Partners"
              className="w-full sm:w-[90%] rounded-2xl drop-shadow-md h-[300px]"
            />
          </div>

          {/* Money bag illustration */}
          <div className="flex justify-center pt-2 pb-1">
            <img
              src="/images/vellora-money-bag.png"
              alt="Vellora earnings illustration"
              className="w-36 h-25 object-contain"
            />
          </div>

          {/* Text block */}
          <div className="px-6 text-center flex-1 flex flex-col justify-center pb-2">
            <p className="text-xs text-stone-500 mb-1.5 font-medium tracking-wide">Before you move forward</p>
            <h2 className="text-[22px] font-extrabold text-stone-900 leading-tight mb-2">
              Know how much you<br />can earn with us
            </h2>
            <p className="text-sm text-stone-400">Real earnings from real partner like you</p>
          </div>

          {/* CTA button */}
          <div className="px-5 pb-10 pt-2 shrink-0">
            <button
              onClick={() => setStep("EARNINGS_DETAIL")}
              id="check-earnings-btn"
              className="w-full rounded-2xl py-4 font-bold text-base bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
            >
              Check your earnings
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          STEP 5 — EARNINGS DETAIL
      ══════════════════════════════════════════════ */}
      {step === "EARNINGS_DETAIL" && (
        <div
          className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300"
          style={{ background: "#FEFDFC" }}
        >
          {/* Back arrow */}
          <div className="px-4 pt-4 pb-0 shrink-0">
            <button
              onClick={() => setStep("EARNINGS_PREVIEW")}
              className="p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-stone-700" />
            </button>
          </div>

          {/* Money bag illustration */}
          <div className="flex justify-center pt-1 pb-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/vellora-money-bag.png"
              alt="Vellora earnings"
              className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 object-contain"
            />
          </div>

          {/* Scrollable middle area so short/landscape screens don't clip content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Earning potential card */}
            <div className="mx-4 rounded-2xl border border-stone-100 bg-white shadow-sm px-4 py-3 sm:py-3.5">
              <p className="text-xs font-semibold text-stone-700 mb-1 text-center">
                Your earning potential
              </p>
              <p
                className="font-extrabold text-center leading-tight transition-all duration-300"
                style={{
                  color: "#C9851A",
                  fontSize: "clamp(1.5rem, 6vw, 1.875rem)", // scales on narrow screens instead of fixed text-3xl
                }}
              >
                {earningMap[workHours]}
              </p>
              <div className="flex justify-center mt-1.5 mb-2">
                <span
                  className="text-[11px] font-semibold px-4 py-1 rounded-full"
                  style={{ background: "#F5EDD8", color: "#9B6B0E" }}
                >
                  Per month
                </span>
              </div>
              <p className="text-[11px] text-stone-400 text-center leading-relaxed px-2">
                Based on your availability &amp; completed services
              </p>
            </div>

            {/* Work hours selector card */}
            <div className="mx-4 mt-3 p-3.5 rounded-2xl border border-stone-100 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#FDF3E7" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9851A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <circle cx="16" cy="16" r="3" stroke="#C9851A" strokeWidth="1.8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-stone-850 truncate">Work Hours</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 truncate">Choose your daily availability</p>
                </div>
              </div>

              <div className="flex gap-2">
                {[4, 6, 8].map((h) => (
                  <button
                    key={h}
                    onClick={() => setWorkHours(h)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${workHours === h
                      ? "bg-[#0D0D0D] text-white shadow-md"
                      : "bg-[#F9F6F0] text-stone-700 hover:bg-stone-100"
                      }`}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Get started CTA — safe-area aware so it clears the home indicator */}
          <div
            className="px-4 pt-4 shrink-0"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={handleFinalComplete}
              id="final-continue-btn"
              className="w-full rounded-2xl py-3.5 font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
            >
              Get started
            </button>
          </div>
        </div>
      )}
      {/* ── Floating Notification ────────────────────────────────────── */}
      <div
        className={`absolute left-1/2 z-[60] w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-stone-900 p-3.5 text-white shadow-2xl transition-all duration-500 ${notification.visible ? "bottom-6 opacity-100" : "-bottom-full opacity-0"
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

// ─── Main export ─────────────────────────────────────────────────────────────
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

  // MOBILE — full-screen white sheet
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
        <LoginFormContent onClose={onClose} onComplete={onComplete} />
      </div>
    );
  }

  // DESKTOP — centered Dialog card (390 × 844, iPhone proportions)
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
