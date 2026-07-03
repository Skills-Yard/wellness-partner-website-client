'use client';

import React, { useState } from "react";
import { Video, ChevronRight, Bell, User } from "lucide-react";
import BottomNav from "./BottomNav";

// ─── Hero Banner — full-width, responsive height ──────────────────────────────
function HeroBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #8B5E1A 0%, #C9851A 50%, #E8A830 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full opacity-20" style={{ background: "#F5A623" }} />
      <div className="absolute -left-8 bottom-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#fff" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 sm:py-5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
            <User className="h-4 w-4 text-white" />
          </div>
          {/* Logo */}
          <div className="flex flex-col items-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2C14 2 8 8 8 14c0 3.314 2.686 6 6 6s6-2.686 6-6c0-6-6-12-6-12Z" fill="#fff" fillOpacity="0.9" />
              <path d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z" fill="#C9851A" />
            </svg>
            <span className="text-white font-bold text-xs tracking-[0.15em] mt-0.5">VELLORA</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
            <Bell className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Hero content */}
        <div className="flex items-end justify-between pb-5 gap-4">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-bold tracking-wide mb-1" style={{ color: "#FFD580" }}>Be Your Own Boss</p>
            <p className="text-sm sm:text-base font-semibold text-white/80">Earn upto</p>
            <p className="text-4xl sm:text-5xl font-extrabold leading-none mb-2" style={{ color: "#FFD580" }}>₹70,000</p>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-xs">
              Join 7,000+ partners across 55+ cities in India.
            </p>
          </div>
          {/* Couple illustration */}
          <div className="shrink-0 hidden sm:block relative" style={{ width: "150px", height: "160px" }}>
            <svg width="75" height="150" viewBox="0 0 65 140" className="absolute right-0 bottom-0">
              <rect x="15" y="70" width="35" height="65" rx="8" fill="#D4C4A8" />
              <rect x="27" y="55" width="11" height="18" rx="5.5" fill="#C68642" />
              <ellipse cx="32" cy="44" rx="16" ry="18" fill="#C68642" />
              <ellipse cx="32" cy="28" rx="15" ry="7" fill="#1A0A00" />
              <ellipse cx="26" cy="42" rx="2" ry="2.5" fill="#1A0A00" />
              <ellipse cx="38" cy="42" rx="2" ry="2.5" fill="#1A0A00" />
              <path d="M27 50 Q32 54 37 50" stroke="#7A3B1E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M22 72 L32 65 L42 72" fill="#BCA888" />
            </svg>
            <svg width="75" height="145" viewBox="0 0 65 135" className="absolute left-0 bottom-0" style={{ zIndex: 1 }}>
              <rect x="14" y="68" width="36" height="50" rx="8" fill="#D4C4A8" />
              <rect x="27" y="53" width="11" height="18" rx="5.5" fill="#C68642" />
              <ellipse cx="32" cy="42" rx="15" ry="17" fill="#C68642" />
              <ellipse cx="32" cy="27" rx="15" ry="7" fill="#1A0A00" />
              <ellipse cx="18" cy="42" rx="4" ry="11" fill="#1A0A00" />
              <ellipse cx="46" cy="42" rx="4" ry="11" fill="#1A0A00" />
              <ellipse cx="26" cy="41" rx="2" ry="2.5" fill="#1A0A00" />
              <ellipse cx="38" cy="41" rx="2" ry="2.5" fill="#1A0A00" />
              <path d="M27 49 Q32 53 37 49" stroke="#7A3B1E" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M20 70 L32 63 L44 70" fill="#BCA888" />
            </svg>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2 sm:gap-3 pb-5">
          {[
            { icon: "👥", label: "7,000+ Partners" },
            { icon: "🏙️", label: "55+ Cities" },
            { icon: "📈", label: "₹70K/mo" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <span className="text-sm">{s.icon}</span>
              <span className="text-xs font-semibold text-white">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step icon ────────────────────────────────────────────────────────────────
function StepIcon({ type, active }: { type: string; active: boolean }) {
  const bg = active ? "#C9851A" : "#F5EDD8";
  const fg = active ? "#fff" : "#C9851A";
  const icons: Record<string, React.ReactNode> = {
    session: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" fill={fg} />
        <rect x="7" y="9" width="10" height="1.5" rx="0.75" fill={bg} />
        <rect x="7" y="12" width="6" height="1.5" rx="0.75" fill={bg} />
      </svg>
    ),
    starterkit: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 8h14l-1.5 9H6.5L5 8Z" fill={fg} />
        <path d="M9 8V6a3 3 0 016 0v2" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    profile: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={fg} />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    training: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L2 8l10 5 10-5-10-5Z" fill={fg} />
        <path d="M2 12l10 5 10-5M2 16l10 5 10-5" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  return (
    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
      {icons[type]}
    </div>
  );
}

// ─── Session thumbnail ────────────────────────────────────────────────────────
function SessionThumb() {
  return (
    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #EDE0D4 0%, #C9BDB5 100%)" }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <ellipse cx="18" cy="22" rx="11" ry="7" fill="#A0856A" />
        <ellipse cx="18" cy="20" rx="11" ry="7" fill="#B8967A" />
        <rect x="9" y="11" width="18" height="5" rx="2.5" fill="#8B6E4E" />
        <rect x="11" y="11" width="2" height="5" fill="#7A5E3F" />
        <rect x="16" y="11" width="2" height="5" fill="#7A5E3F" />
        <rect x="21" y="11" width="2" height="5" fill="#7A5E3F" />
        <path d="M25 9 Q29 7 31 11 Q27 13 25 9Z" fill="#6B8C3A" />
      </svg>
    </div>
  );
}

function AboutCard({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
      <SessionThumb />
      <p className="flex-1 text-sm sm:text-base font-semibold text-stone-800">{title}</p>
      <ChevronRight className="h-5 w-5 text-stone-400 shrink-0" />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PartnerHomescreen() {
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");
  const steps = [
    { key: "session", label: "Session" },
    { key: "starterkit", label: "Starter kit" },
    { key: "profile", label: "Profile" },
    { key: "training", label: "Training" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeroBanner />

      {/* Body content — responsive max-width container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">

        {/* Desktop: 2-col grid | Mobile: single col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Trainer Card ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 leading-snug mb-1">
              You&apos;ve been selected to meet our trainer
            </h2>
            <p className="text-sm text-stone-400 mb-5">
              We will know more about your work experience
            </p>

            {/* Progress steps */}
            <div className="relative flex items-start justify-between mb-5">
              <div className="absolute top-5 sm:top-6 left-5 sm:left-6 right-5 sm:right-6 h-[2px]"
                style={{ background: "linear-gradient(90deg, #C9851A 25%, #E8D5B0 25%)" }} />
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                  <StepIcon type={s.key} active={i === 0} />
                  <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight"
                    style={{ color: i === 0 ? "#C9851A" : "#78716C" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">👋</span>
              <span className="text-sm font-semibold text-stone-800">3 July, 11 AM</span>
            </div>

            {/* Video Call */}
            <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                <Video className="h-4 w-4 text-stone-600" />
              </div>
              <span className="text-sm font-medium text-stone-700 flex-1">Video Call</span>
              <ChevronRight className="h-4 w-4 text-stone-400" />
            </div>
          </div>

          {/* ── Earning Teaser ─────────────────────────────────────── */}
          <div className="rounded-2xl px-5 py-5 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #FDF7F2 0%, #F5EDD8 100%)" }}>
            <div>
              <p className="text-sm text-stone-500 mb-1">Your earning potential</p>
              <p className="text-4xl sm:text-5xl font-extrabold" style={{ color: "#C9851A" }}>₹47,199</p>
              <p className="text-xs text-stone-400 mt-1">per month · 8 hrs/day</p>
            </div>
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: "#C9851A" }}>
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="10" fill="#fff" fillOpacity="0.2" />
                <path d="M14 8v8M14 8l-3 3M14 8l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 20h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── About This Stage ─────────────────────────────────────── */}
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 mb-4">About this stage</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <AboutCard title="What is skill session?" />
            <AboutCard title="How to prepare?" />
            <AboutCard title="How to attend the session?" />
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <button className="w-full sm:max-w-xs rounded-2xl py-4 font-bold text-base bg-stone-900 text-white hover:bg-stone-800 shadow-lg transition-all active:scale-[0.98] cursor-pointer">
          Join session now
        </button>
      </div>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
