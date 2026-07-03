'use client';

import React, { useState } from "react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import HeroBanner from "./HeroBanner";
import ProfilePage from "./ProfilePage";
import MoneyPage from "./MoneyPage";

interface ServiceUnavailableProps {
  city: string;
  profession: string;
  onLogout: () => void;
  onCityChange?: (city: string) => void;
}

export default function ServiceUnavailable({ city, profession, onLogout, onCityChange }: ServiceUnavailableProps) {
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

  const cities = ["Mumbai", "Bangalore", "Pune", "Hyderabad", "Chennai"];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-0">
      <DesktopNav active={activeTab} onNavigate={setActiveTab} />
      <HeroBanner />

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-10 lg:px-12 lg:py-16 xl:py-20"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #FDF8EE 0%, transparent 60%)",
        }}
      >
        {/* Mobile: plain stack. Desktop: framed panel. */}
        <div
          className="w-full max-w-xs
                     lg:max-w-5xl xl:max-w-6xl
                     lg:rounded-[2rem] lg:border lg:border-stone-100 lg:bg-white
                     lg:shadow-[0_1px_2px_rgba(0,0,0,0.02),0_20px_48px_-24px_rgba(0,0,0,0.06)]
                     lg:px-14 xl:px-20 lg:py-14 xl:py-16"
        >
          <div
            className="flex flex-col items-center text-center
                       lg:flex-row lg:items-center lg:text-left lg:gap-16 xl:gap-24"
          >
            {/* Illustration side */}
            <div className="mb-5 lg:mb-0 lg:shrink-0">
              <div className="relative flex items-center justify-center">
                {/* backdrop ring, desktop only */}
                <div
                  className="hidden lg:flex items-center justify-center w-64 h-64 xl:w-72 xl:h-72 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, #FBF3E1 0%, #FDFBF7 65%, transparent 100%)",
                  }}
                >
                  <div className="absolute inset-6 rounded-full border border-dashed border-[#E9D8AE]" />
                </div>
                <img
                  src="/images/briefcase_unavailable.png"
                  alt="No hiring"
                  className="w-32 h-32 lg:w-44 lg:h-44 xl:w-48 xl:h-48 object-contain drop-shadow-sm lg:absolute"
                />
              </div>
            </div>

            {/* Divider between columns, desktop only */}
            <div className="hidden lg:block w-px self-stretch bg-stone-100" />

            {/* Text side */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:flex-1 lg:pl-2 xl:pl-4">
              {/* Eyebrow, desktop only */}
              <span
                className="hidden lg:inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                style={{ background: "#F5EDD8", color: "#9B6B0E" }}
              >
                Not available yet
              </span>

              {/* Heading */}
              <h2 className="text-xl lg:text-[2.15rem] xl:text-4xl font-black text-stone-900 leading-snug lg:leading-[1.15] mb-1 lg:mb-3">
                Oops! We are not hiring
                <br className="lg:hidden" />
                <span className="lg:hidden"> </span>
                for {profession} in
                <br className="lg:hidden" />
                <span className="lg:hidden"> </span>
                {city}
              </h2>

              {/* Thin gold divider, mobile only */}
              <div className="w-28 lg:hidden h-[1.5px] bg-[#C9851A]/35 my-3.5" />

              <p className="text-sm lg:text-base text-stone-450 leading-relaxed max-w-60 lg:max-w-sm">
                We will notify you once we
                <br className="lg:hidden" /> start hiring in your area
              </p>

              {/* Available cities */}
              <div className="w-full mt-8 lg:mt-10">
                <p className="text-[10px] lg:text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 lg:mb-3.5 text-left">
                  Currently hiring in
                </p>
                <div className="flex flex-wrap gap-2 lg:gap-2.5 justify-start rounded-2xl border border-stone-100 bg-[#FAFAF9] lg:bg-transparent lg:border-0 px-4 py-4 lg:p-0">
                  {cities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onCityChange?.(c)}
                      className="text-xs lg:text-sm font-semibold px-3 py-1.5 lg:px-4 lg:py-2 rounded-full cursor-pointer
                                 transition-all active:scale-95
                                 lg:border lg:border-transparent
                                 hover:opacity-90 lg:hover:opacity-100 lg:hover:border-[#C9851A]/30 lg:hover:-translate-y-0.5"
                      style={{ background: "#F5EDD8", color: "#9B6B0E" }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={setActiveTab} />
    </div>
  );
}