'use client';

import React, { useState } from "react";
import { Bell, User } from "lucide-react";
import BottomNav from "./BottomNav";

function HeroBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #8B5E1A 0%, #C9851A 50%, #E8A830 100%)" }}
    >
      <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full opacity-20" style={{ background: "#F5A623" }} />
      <div className="absolute -left-8 bottom-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#fff" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 sm:py-5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
            <User className="h-4 w-4 text-white" />
          </div>
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

        {/* Hero text + couple */}
        <div className="flex items-end justify-between pb-5 gap-4">
          <div className="flex-1">
            <p className="text-xs sm:text-sm font-bold tracking-wide mb-1" style={{ color: "#FFD580" }}>Be Your Own Boss</p>
            <p className="text-sm sm:text-base font-semibold text-white/80">Earn upto</p>
            <p className="text-4xl sm:text-5xl font-extrabold leading-none mb-2" style={{ color: "#FFD580" }}>₹70,000</p>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-xs">
              Join 7,000+ partners across 55+ cities in India.
            </p>
          </div>
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

function UnavailableIllustration() {
  return (
    <div className="relative inline-block">
      <div className="w-32 h-28 sm:w-36 sm:h-32 rounded-2xl flex items-center justify-center shadow-sm"
        style={{ background: "linear-gradient(135deg, #F5EDD8 0%, #E8D4A8 100%)" }}>
        <svg width="68" height="58" viewBox="0 0 68 58" fill="none">
          <rect x="4" y="18" width="60" height="36" rx="7" fill="url(#bagGrad2)" />
          <path d="M23 18V13C23 10.791 24.791 9 27 9H41C43.209 9 45 10.791 45 13V18"
            stroke="#A06B10" strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="4" y1="34" x2="64" y2="34" stroke="#A06B10" strokeWidth="1.5" strokeOpacity="0.5" />
          <rect x="28" y="28" width="12" height="8" rx="2.5" fill="#A06B10" fillOpacity="0.7" />
          <defs>
            <linearGradient id="bagGrad2" x1="4" y1="18" x2="64" y2="54" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4941A" />
              <stop offset="1" stopColor="#9B6B0E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ background: "#EF4444" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

interface ServiceUnavailableProps {
  city: string;
  profession: string;
}

export default function ServiceUnavailable({ city, profession }: ServiceUnavailableProps) {
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeroBanner />

      {/* Content — centred, responsive max-width */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 py-10 sm:py-14">
        <div className="w-full max-w-md flex flex-col items-center text-center">

          {/* Illustration */}
          <div className="mb-7">
            <UnavailableIllustration />
          </div>

          {/* Message */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-tight mb-3">
            Oops! We are not hiring<br />
            for {profession} in {city}
          </h2>
          <p className="text-sm sm:text-base text-stone-400 leading-relaxed mb-8 max-w-sm">
            We will notify you once we start hiring in your area
          </p>

          {/* CTAs */}
          <button className="w-full rounded-2xl py-4 font-bold text-sm sm:text-base bg-stone-900 text-white hover:bg-stone-800 shadow-lg transition-all active:scale-[0.98] cursor-pointer mb-3">
            Notify me when available
          </button>
          <button className="w-full rounded-2xl py-4 font-bold text-sm sm:text-base border-2 border-stone-200 text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer">
            Explore other cities
          </button>

          {/* Available cities */}
          <div className="w-full mt-8 rounded-2xl border border-stone-100 bg-stone-50 px-5 py-5 text-left">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
              Currently hiring in
            </p>
            <div className="flex flex-wrap gap-2">
              {["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai"].map((c) => (
                <span key={c} className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: "#F5EDD8", color: "#9B6B0E" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
