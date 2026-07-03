'use client';

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ArrowLeft,
  Search,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Assuming this is your data source
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

type AuthStep = "PHONE" | "OTP" | "ONBOARDING";

export default function LoginForm({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete?: () => void;
}) {
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [timer, setTimer] = useState(26);

  // Onboarding Form State
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [city, setCity] = useState("");
  const [agreed, setAgreed] = useState(false);

  // Sub-view states
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const [showWorkSelect, setShowWorkSelect] = useState(false);
  const [workSearch, setWorkSearch] = useState("");

  const [notification, setNotification] = useState({
    visible: false,
    message: "",
  });

  // ==========================================
  // 1. PHONE STEP logic
  // ==========================================
  const handlePhoneSubmit = () => {
    if (phone.length >= 10) setStep("OTP");
  };

  const handleSkip = () => {
    onClose(); // Skip functionality
  };

  // ==========================================
  // 2. OTP SIMULATION logic
  // ==========================================
  useEffect(() => {
    let countdown: NodeJS.Timeout;
    let otpTimer: NodeJS.Timeout;
    
    if (step === "OTP") {
      // Timer countdown
      countdown = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Auto-fill simulation
      otpTimer = setTimeout(() => {
        const generatedOtp = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        
        setNotification({
          visible: true,
          message: `Your verification code is ${generatedOtp}`,
        });

        setTimeout(() => {
          setOtp(generatedOtp.split(""));
          setNotification({ visible: false, message: "" });
          setTimeout(() => setStep("ONBOARDING"), 600);
        }, 2000);
      }, 1500);
    }

    return () => {
      clearTimeout(otpTimer);
      clearInterval(countdown);
    };
  }, [step]);

  // ==========================================
  // 3. ONBOARDING logic
  // ==========================================
  const handleComplete = () => {
    if (onComplete) onComplete(); // Triggers the Toast & Profile unlock
    else onClose();
    router.push("/");
  };

  const hasSpecialChar = name.trim().length > 0 && /[^a-zA-Z\s]/.test(name);
  const isFormValid =
    name.trim().length > 0 && !hasSpecialChar && profession && city && agreed;

  // Filter lists based on search
  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );
  const filteredProfessions = professions.filter((p) =>
    p.toLowerCase().includes(workSearch.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        // Added 'relative' context to keep the notification constrained inside the modal
        className="relative w-[calc(100%-2rem)] max-w-sm p-0 overflow-hidden bg-white rounded-[24px] border border-stone-100 shadow-2xl flex flex-col gap-0 h-auto max-h-[90vh] outline-none animate-in fade-in duration-200"
        showCloseButton={false}
      >
        {/* Screen reader title to satisfy Radix UI accessibility requirements */}
        <h2 className="sr-only">Authentication Flow</h2>

        {/* ==========================================
            VIEW: CITY SELECTION (Overlay)
        ========================================== */}
        {showCitySelect && step === "ONBOARDING" ? (
          <div className="absolute inset-0 z-20 flex flex-col bg-white h-full slide-in-from-right-full duration-300">
            <div className="flex items-center px-4 py-3 border-b border-stone-100">
              <button onClick={() => setShowCitySelect(false)} className="mr-3 p-1 hover:bg-stone-50 rounded-full transition-colors cursor-pointer flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-stone-700" />
              </button>
              <h2 className="text-xs font-bold text-stone-800">Select City</h2>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center rounded-full border border-stone-200 bg-stone-50/50 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all focus-within:bg-white">
                <Search className="h-3.5 w-3.5 text-stone-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search your city"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full text-xs outline-none text-stone-800 bg-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredCities.map((c, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-dashed border-stone-100 cursor-pointer animate-in fade-in duration-150"
                >
                  <span className="text-xs text-stone-700">{c}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${city === c ? "border-amber-500" : "border-stone-300"}`}
                  >
                    {city === c && (
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="city"
                    value={c}
                    checked={city === c}
                    onChange={() => {
                      setCity(c);
                      setShowCitySelect(false);
                    }}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* ==========================================
            VIEW: WORK SELECTION (Overlay)
        ========================================== */}
        {showWorkSelect && step === "ONBOARDING" ? (
          <div className="absolute inset-0 z-20 flex flex-col bg-white h-full slide-in-from-right-full duration-300">
            <div className="flex items-center px-4 py-3 border-b border-stone-100">
              <button onClick={() => setShowWorkSelect(false)} className="mr-3 p-1 hover:bg-stone-50 rounded-full transition-colors cursor-pointer flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-stone-700" />
              </button>
              <h2 className="text-xs font-bold text-stone-800">Select Profession</h2>
            </div>

            <div className="px-4 py-3">
              <div className="flex items-center rounded-full border border-stone-200 bg-stone-50/50 px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all focus-within:bg-white">
                <Search className="h-3.5 w-3.5 text-stone-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search profession"
                  value={workSearch}
                  onChange={(e) => setWorkSearch(e.target.value)}
                  className="w-full text-xs outline-none text-stone-800 bg-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredProfessions.map((p, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-dashed border-stone-100 cursor-pointer animate-in fade-in duration-150"
                >
                  <span className="text-xs text-stone-700">{p}</span>
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${profession === p ? "border-amber-500" : "border-stone-300"}`}
                  >
                    {profession === p && (
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="profession"
                    value={p}
                    checked={profession === p}
                    onChange={() => {
                      setProfession(p);
                      setShowWorkSelect(false);
                    }}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {/* ==========================================
            MAIN CONTENT AREA
        ========================================== */}
        <div className="flex-1 flex flex-col">
          {/* --- STEP 1: PHONE --- */}
          {step === "PHONE" && (
            <div className="flex flex-col px-5 py-5 animate-in fade-in duration-350">
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleSkip}
                  className="rounded-full border border-stone-200 px-4 py-1 text-xs font-semibold text-stone-600 active:scale-95 transition-transform hover:bg-stone-50 cursor-pointer"
                >
                  Skip
                </button>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="mb-4 h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <PhoneCall className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-bold text-stone-900">
                  Enter your phone number
                </h2>
                <p className="mt-1 text-xs text-stone-500 leading-normal">
                  We&apos;ll send you a text with a verification code.
                </p>

                <div className="mt-5 flex rounded-xl border border-stone-200 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 overflow-hidden transition-all bg-stone-50/20">
                  <div className="flex items-center gap-1 border-r border-stone-200 px-3 bg-stone-50/50">
                    <span className="text-sm text-stone-700 font-medium">
                      +91
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    autoFocus
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full px-3 py-2.5 text-sm text-stone-900 outline-none font-medium animate-none bg-transparent"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-100 text-center">
                <p className="text-[11px] text-stone-400 mb-3">
                  By continuing, you agree to our{" "}
                  <span className="underline font-medium cursor-pointer text-stone-500">
                    T&amp;C
                  </span>{" "}
                  and{" "}
                  <span className="underline font-medium cursor-pointer text-stone-500">
                    Privacy policy
                  </span>
                </p>
                <button
                  onClick={handlePhoneSubmit}
                  disabled={phone.length < 10}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                    phone.length >= 10
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/10 hover:bg-amber-600"
                      : "bg-stone-100 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 2: OTP --- */}
          {step === "OTP" && (
            <div className="flex flex-col px-5 py-5 animate-in fade-in duration-350">
              <button onClick={() => setStep("PHONE")} className="mb-4 w-fit p-1 hover:bg-stone-50 rounded-full transition-colors cursor-pointer flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 text-stone-700" />
              </button>

              <div className="flex-1 flex flex-col">
                <div className="mb-4 h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <MessageSquare className="h-5 w-5" />
                </div>

                <h2 className="text-lg font-bold text-stone-900">
                  Enter verification code
                </h2>
                <p className="mt-1 text-xs text-stone-500 leading-normal">
                  A 6-digit code has been sent on +91 {phone}
                </p>

                <div className="mt-5 flex justify-between gap-1.5 max-w-[280px]">
                  {otp.map((digit, index) => (
                    <div
                      key={index}
                      className={`flex h-10 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all ${
                        digit !== ""
                          ? "border-stone-850 text-stone-900 bg-stone-50/30"
                          : index === 0
                            ? "border-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,1)]"
                            : "border-stone-200"
                      }`}
                    >
                      {digit ||
                        (index === 0 ? (
                          <span className="animate-pulse">|</span>
                        ) : (
                          ""
                        ))}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50/50 px-2.5 py-1 rounded-full w-fit animate-pulse">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  <span>Auto-filling mock verification code...</span>
                </div>

                <div className="mt-6 border-t border-dashed border-stone-200 pt-4 flex items-center gap-1.5 text-stone-400 font-medium text-xs">
                  <span>⏱</span>
                  <span>0:{timer < 10 ? `0${timer}` : timer}</span>
                </div>
              </div>
            </div>
          )}

          {/* --- STEP 3: ONBOARDING --- */}
          {step === "ONBOARDING" && (
            <div className="flex flex-col bg-white animate-in fade-in duration-350">
              <div className="flex justify-end p-3 pb-0">
                <button className="flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold shadow-xs hover:bg-stone-50 cursor-pointer">
                  <span className="text-xs">Aअ</span> English
                </button>
              </div>

              <div className="px-5 pt-2 pb-5 flex-1 flex flex-col">
                <h2 className="text-lg font-bold text-stone-900 mb-3.5">
                  Tell us about yourself!
                </h2>

                <div className="space-y-3 flex-1">
                  {/* Name Input */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                      What&apos;s your name?
                    </label>
                    <div
                      className={`mt-1 rounded-xl border px-3 py-1.5 bg-stone-50/50 hover:bg-stone-50 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all ${name ? "border-amber-500" : "border-stone-200"}`}
                    >
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Himanshu"
                        className="w-full outline-none text-xs text-stone-900 bg-transparent"
                        autoFocus
                      />
                    </div>
                    {hasSpecialChar && (
                      <p className="mt-1 ml-1 text-[9px] text-red-500 font-semibold leading-normal">
                        Special characters are not allowed
                      </p>
                    )}
                  </div>

                  {/* Profession & City inputs side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Profession Select Trigger */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                        Work
                      </label>
                      <div
                        onClick={() => setShowWorkSelect(true)}
                        className="mt-1 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-amber-500 px-3 py-1.5 cursor-pointer transition-all"
                      >
                        <span
                          className={`text-xs truncate ${profession ? "text-stone-900 font-medium" : "text-stone-400"}`}
                        >
                          {profession || "Select"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" />
                      </div>
                    </div>

                    {/* City Select Trigger */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 ml-1">
                        City
                      </label>
                      <div
                        onClick={() => setShowCitySelect(true)}
                        className="mt-1 flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-amber-500 px-3 py-1.5 cursor-pointer transition-all"
                      >
                        <span
                          className={`text-xs truncate ${city ? "text-stone-900 font-medium" : "text-stone-400"}`}
                        >
                          {city || "Select"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-stone-400 leading-normal">
                      I agree to Velora&apos;s <span className="underline font-medium text-stone-500">T&amp;C</span> and <span className="underline font-medium text-stone-500">Privacy policy</span>
                    </p>
                  </label>

                  <button
                    onClick={handleComplete}
                    disabled={!isFormValid}
                    className={`w-full rounded-xl py-2 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer ${
                      isFormValid
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/10 hover:bg-amber-600"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Notification Message - Switched to absolute positioning */}
        <div
          className={`absolute left-1/2 z-[60] w-[90%] max-w-xs -translate-x-1/2 rounded-2xl bg-stone-900 p-3 text-white shadow-2xl transition-all duration-500 ${
            notification.visible
              ? "bottom-4 opacity-100"
              : "-bottom-full opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-stone-400">Messages • Now</p>
              <p className="text-xs font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}