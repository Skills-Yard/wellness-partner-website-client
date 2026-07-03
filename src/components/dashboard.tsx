'use client';

import React, { useState } from "react";
import LoginForm from "./loginOnboarding/loginForm";
import PartnerHomescreen from "./home/PartnerHomescreen";
import ServiceUnavailable from "./home/ServiceUnavailable";
import {
  isServiceAvailable,
  DEFAULT_CITY,
  DEFAULT_PROFESSION,
} from "@/src/utils/data/serviceAvailability";

type AppScreen = "LANDING" | "STEP6_AVAILABLE" | "STEP7_UNAVAILABLE";
interface UserData { city: string; profession: string; }

function VelloraLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
      <path d="M14 2C14 2 8 8 8 14c0 3.314 2.686 6 6 6s6-2.686 6-6c0-6-6-12-6-12Z" fill="#C9851A" fillOpacity="0.18" />
      <path d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z" fill="#C9851A" />
    </svg>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({
  onStart,
  onPreviewAvailable,
  onPreviewUnavailable,
}: {
  onStart: () => void;
  onPreviewAvailable: () => void;
  onPreviewUnavailable: () => void;
}) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(160deg, #FDF7F2 0%, #FFFFFF 60%, #FDF7F2 100%)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <VelloraLogo />
        <span className="text-3xl sm:text-4xl font-extrabold tracking-[0.2em] text-stone-900">VELLORA</span>
        <p className="text-base text-stone-400 text-center leading-relaxed max-w-xs">
          India&apos;s #1 wellness partner platform
        </p>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {[
          { icon: "👥", label: "7,000+ Partners" },
          { icon: "🏙️", label: "55+ Cities" },
          { icon: "📈", label: "Earn ₹70K/mo" },
        ].map((t) => (
          <span key={t.label} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "#F5EDD8", color: "#9B6B0E" }}>
            <span>{t.icon}</span> {t.label}
          </span>
        ))}
      </div>

      {/* Main CTA */}
      <button
        onClick={onStart}
        className="w-full max-w-sm rounded-2xl py-4 font-bold text-base bg-stone-900 text-white hover:bg-stone-800 shadow-lg transition-all active:scale-[0.98] cursor-pointer mb-6"
      >
        Get started
      </button>

      {/* ── Dev Preview shortcuts ───────────────────────────────────────
          Quick access to STEP 6 and STEP 7 without going through login  */}
      <div className="w-full max-w-sm rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center mb-3">
          Preview screens
        </p>
        <div className="flex gap-3">
          <button
            onClick={onPreviewAvailable}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold border-2 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
            style={{ borderColor: "#C9851A", color: "#C9851A", background: "#FDF7F2" }}
          >
            ✅ Service Available<br />
            <span className="text-[10px] font-medium opacity-70">STEP 6 · Mumbai</span>
          </button>
          <button
            onClick={onPreviewUnavailable}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold border-2 border-red-200 text-red-500 bg-red-50 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            ❌ Not Available<br />
            <span className="text-[10px] font-medium opacity-70">STEP 7 · Delhi NCR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardContent() {
  const [screen, setScreen] = useState<AppScreen>("LANDING");
  const [showLogin, setShowLogin] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    city: DEFAULT_CITY,
    profession: DEFAULT_PROFESSION,
  });

  const handleLoginComplete = (data: { city: string; profession: string }) => {
    setUserData(data);
    setShowLogin(false);
    setScreen(isServiceAvailable(data.city, data.profession) ? "STEP6_AVAILABLE" : "STEP7_UNAVAILABLE");
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* ── LANDING ──────────────────────────────────────────────────── */}
      {screen === "LANDING" && (
        <LandingPage
          onStart={() => setShowLogin(true)}
          onPreviewAvailable={() => {
            setUserData({ city: "Mumbai", profession: "Massage Therapist" });
            setScreen("STEP6_AVAILABLE");
          }}
          onPreviewUnavailable={() => {
            setUserData({ city: DEFAULT_CITY, profession: DEFAULT_PROFESSION });
            setScreen("STEP7_UNAVAILABLE");
          }}
        />
      )}

      {/* ── LOGIN FLOW (STEPS 1–5) ────────────────────────────────────
          LoginForm renders as a Dialog on desktop, full-screen on mobile */}
      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onComplete={handleLoginComplete}
        />
      )}

      {/* ── STEP 6: Service AVAILABLE ─────────────────────────────────── */}
      {screen === "STEP6_AVAILABLE" && <PartnerHomescreen />}

      {/* ── STEP 7: Service UNAVAILABLE ───────────────────────────────── */}
      {screen === "STEP7_UNAVAILABLE" && (
        <ServiceUnavailable city={userData.city} profession={userData.profession} />
      )}
    </div>
  );
}