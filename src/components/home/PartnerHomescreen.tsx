"use client";

import React, { useState } from "react";
import { Video, ChevronRight } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import HeroBanner from "./HeroBanner";
import ProfilePage from "./ProfilePage";
import MoneyPage from "./MoneyPage";

interface PartnerHomescreenProps {
  city: string;
  profession: string;
  onLogout: () => void;
}



function StepIcon({ type, active }: { type: string; active: boolean }) {
  const bg = active ? "#FDF3E7" : "#F8F6F2";
  const borderCol = active ? "#C9851A" : "#E5E1DA";
  const fg = active ? "#C9851A" : "#A39E93";

  const icons: Record<string, React.ReactNode> = {
    session: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* Two people heads */}
        <circle cx="8" cy="9" r="3" fill={fg} fillOpacity={active ? 1 : 0.7} />
        <path d="M3 17c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1Z" fill={fg} fillOpacity={active ? 1 : 0.7} />
        <circle cx="16" cy="10" r="2.5" fill={fg} fillOpacity={active ? 0.8 : 0.5} />
        <path d="M12 17c0-2 1.5-3 4-3s4 1 4 3v1h-8v-1Z" fill={fg} fillOpacity={active ? 0.8 : 0.5} />
        {/* Chat bubble */}
        <path d="M10.5 4.5a2 2 0 0 1 3.5 0l.5.8a1 1 0 0 0 .8.5h.7a2 2 0 0 1 0 4h-.7a1 1 0 0 0-.8.5l-.5.8a2 2 0 0 1-3.5 0l-.5-.8a1 1 0 0 0-.8-.5H8a2 2 0 0 1 0-4h.7a1 1 0 0 0 .8-.5l.5-.8Z" fill="#C9851A" fillOpacity={active ? 0.85 : 0.3} />
        <circle cx="10" cy="6.5" r="0.75" fill="#FFF" fillOpacity={active ? 1 : 0.4} />
        <circle cx="12" cy="6.5" r="0.75" fill="#FFF" fillOpacity={active ? 1 : 0.4} />
        <circle cx="14" cy="6.5" r="0.75" fill="#FFF" fillOpacity={active ? 1 : 0.4} />
      </svg>
    ),
    starterkit: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* Open box */}
        <path d="M4 9l8-4 8 4-8 4-8-4Z" fill={fg} fillOpacity={active ? 0.7 : 0.4} />
        <path d="M4 9v7.5l8 4.5v-8L4 9Z" fill={fg} fillOpacity={active ? 0.95 : 0.6} />
        <path d="M20 9v7.5l-8 4.5v-8l8-4Z" fill={fg} fillOpacity={active ? 0.85 : 0.5} />
        {/* Box flap left */}
        <path d="M4 9l8 4v-2.5L5.5 7.5 4 9Z" fill={active ? "#DDA15E" : fg} fillOpacity={active ? 0.8 : 0.4} />
        {/* Box flap right */}
        <path d="M20 9l-8 4v-2.5l6.5-3 1.5 1.5Z" fill={active ? "#DDA15E" : fg} fillOpacity={active ? 0.8 : 0.4} />
        {/* Content peaking out */}
        <rect x="9" y="8" width="6" height="3" rx="0.5" fill={active ? "#C9851A" : fg} />
      </svg>
    ),
    profile: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* Document/Resume card */}
        <rect x="5" y="4" width="14" height="16" rx="2" fill={fg} fillOpacity={active ? 0.7 : 0.4} stroke={fg} strokeWidth="1" />
        <line x1="8" y1="8" x2="16" y2="8" stroke={active ? "#FEFDFC" : "#F4F3F0"} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8" y1="12" x2="14" y2="12" stroke={active ? "#FEFDFC" : "#F4F3F0"} strokeWidth="1.8" strokeLinecap="round" />
        <line x1="8" y1="16" x2="12" y2="16" stroke={active ? "#FEFDFC" : "#F4F3F0"} strokeWidth="1.8" strokeLinecap="round" />
        {/* Checkmark circle */}
        <circle cx="17" cy="16" r="4.5" fill={active ? "#C9851A" : "#A39E93"} stroke="#FFF" strokeWidth="1" />
        <path d="M15 16l1.5 1.5L19 14.5" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    training: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* Graduation cap */}
        <path d="M12 3L2 8l10 5 10-5-10-5Z" fill={fg} stroke={fg} strokeWidth="0.8" />
        <path d="M6 10.5v4c0 2 2.5 3.5 6 3.5s6-1.5 6-3.5v-4" fill={fg} fillOpacity={active ? 0.8 : 0.5} />
        {/* Tassel */}
        <path d="M19 8v4.5M19 12.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" stroke={active ? "#C9851A" : fg} strokeWidth="1.2" />
        {/* Books stack behind */}
        <rect x="9" y="16.5" width="6" height="1.5" rx="0.5" fill={fg} fillOpacity={0.6} />
      </svg>
    ),
  };
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300"
      style={{
        background: bg,
        borderColor: borderCol,
        boxShadow: active ? "0 4px 10px rgba(201, 133, 26, 0.15)" : "none"
      }}
    >
      {icons[type]}
    </div>
  );
}

// ─── Session thumbnail ────────────────────────────────────────────────────────
function SessionThumb() {
  return (
    <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden relative shadow-sm border border-stone-100">
      <img
        src="/images/wood_blocks_thumbnail.png"
        alt="Stage Thumbnail"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function AboutCard({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow">
      <SessionThumb />
      <p className="flex-1 text-sm sm:text-base font-semibold text-stone-850">
        {title}
      </p>
      <ChevronRight className="h-5 w-5 text-stone-450 shrink-0" />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PartnerHomescreen({ city, profession, onLogout }: PartnerHomescreenProps) {
  const [activeTab, setActiveTab] = useState<"home" | "money" | "profile">("home");

  if (activeTab === "profile") {
    return (
      <ProfilePage
        city={city}
        profession={profession}
        onLogout={onLogout}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />
    );
  }

  if (activeTab === "money") {
    return <MoneyPage activeTab={activeTab} onNavigate={setActiveTab} />;
  }
  const steps = [
    { key: "session", label: "Session" },
    { key: "starterkit", label: "Starter kit" },
    { key: "profile", label: "Profile" },
    { key: "training", label: "Training" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-0">
      <DesktopNav active={activeTab} onNavigate={setActiveTab} />
      <HeroBanner />

      {/* Body content — responsive max-width container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">

        {/* Desktop: 2-col grid | Mobile: single col */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* ── Trainer Card (Left on Desktop) ───────────────────── */}
          <div className="lg:col-span-7 bg-white rounded-2xl lg:rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow px-5 py-5 lg:p-8 flex flex-col justify-center relative overflow-hidden">
            {/* Decorative background element for desktop */}
            <div className="hidden lg:block absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FDF3E7] to-transparent rounded-full -translate-y-1/2 translate-x-1/4 opacity-60 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-lg lg:text-3xl font-extrabold text-stone-900 leading-snug mb-1 lg:mb-3">
                You've been selected to meet our trainer
              </h2>
              <p className="text-sm lg:text-base text-stone-450 mb-5 lg:mb-8">
                We will know more about your work experience
              </p>

              {/* Progress steps */}
              <div className="relative flex items-start justify-between mb-5 lg:mb-10">
                <div
                  className="absolute top-5 lg:top-6 left-5 lg:left-8 right-5 lg:right-8 h-[2px] lg:h-[3px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #C9851A 25%, #E8D5B0 25%)",
                  }}
                />
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 relative z-10 flex-1"
                  >
                    <div className="lg:scale-125 lg:mb-2 transition-transform origin-top">
                      <StepIcon type={s.key} active={i === 0} />
                    </div>
                    <span
                      className="text-[10px] lg:text-sm font-semibold text-center leading-tight lg:mt-1 animate-pulse"
                      style={{ color: i === 0 ? "#C9851A" : "#78716C" }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Combined Date & Video Call Card */}
              <div className="rounded-2xl border border-[#FDF8F3] bg-[#FEFDFC]/60 p-1 flex flex-col shadow-sm">
                <div className="flex items-center gap-3.5 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-stone-850">
                    3 July, 11 AM
                  </span>
                </div>

                <div className="h-[1px] bg-stone-100/60 mx-4" />

                <div className="flex items-center gap-3.5 px-4 py-3 cursor-pointer hover:bg-stone-50/50 transition-colors rounded-b-2xl">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
                    <Video className="h-4.5 w-4.5 lg:h-5 lg:w-5" />
                  </div>
                  <span className="text-sm lg:text-base font-bold text-stone-850 flex-1">
                    Video Call
                  </span>
                  <ChevronRight className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-stone-400" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Welcome Banner (Right on Desktop) ────────────────── */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#1C1917] rounded-3xl p-8 flex-col justify-between relative overflow-hidden shadow-xl text-white">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9851A] rounded-full filter blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9851A] rounded-full filter blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <h3 className="text-2xl lg:text-3xl font-black mb-4 leading-tight">
                Ready to start your<br />journey with us?
              </h3>
              <p className="text-stone-300 text-sm lg:text-base leading-relaxed mb-6">
                Complete your sessions and training to get access to top clients in {city} as a {profession}.
              </p>
            </div>

            <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 lg:p-6 mt-auto">
              <div className="flex items-center gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#C9851A] flex items-center justify-center text-white shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lg:scale-125"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <span className="font-bold text-lg lg:text-xl">Next Step</span>
              </div>
              <p className="text-stone-200 text-sm lg:text-base pl-11 lg:pl-13">
                Attend your video call with our expert trainer to proceed.
              </p>
            </div>
          </div>

        </div>



        {/* ── About This Stage ─────────────────────────────────────── */}
        <div className="lg:mt-4">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-stone-900 mb-4 lg:mb-6">
            About this stage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <AboutCard title="What is skill session?" />
            <AboutCard title="How to prepare?" />
            <AboutCard title="How to attend the session?" />
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        {/* <div className="lg:mt-6 lg:mb-10">
          <button className="w-full sm:max-w-xs lg:max-w-sm rounded-2xl py-4 lg:py-5 font-bold text-base lg:text-lg bg-stone-900 text-white hover:bg-stone-800 hover:shadow-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer">
            Join session now
          </button>
        </div> */}
      </div>

      {/* Bottom Nav */}
      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}
