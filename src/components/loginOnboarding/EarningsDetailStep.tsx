import React from "react";
import { ArrowLeft } from "lucide-react";

interface EarningsDetailStepProps {
  workHours: number;
  setWorkHours: (hours: number) => void;
  earningMap: Record<number, string>;
  onBack: () => void;
  onFinalComplete: () => void;
}

export default function EarningsDetailStep({
  workHours,
  setWorkHours,
  earningMap,
  onBack,
  onFinalComplete,
}: EarningsDetailStepProps) {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-300"
      style={{ background: "#FEFDFC" }}
    >
      {/* Back arrow */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-stone-700" />
        </button>
      </div>

      {/* Money bag illustration */}
      <div className="flex justify-center pt-1 pb-2 shrink-0">
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
              fontSize: "clamp(1.5rem, 6vw, 1.875rem)",
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9851A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="16" cy="16" r="3" stroke="#C9851A" strokeWidth="1.8" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-850 truncate">Work Hours</p>
              <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                Choose your daily availability
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {[4, 6, 8].map((h) => (
              <button
                key={h}
                onClick={() => setWorkHours(h)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                  workHours === h
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

      {/* Get started CTA — safe-area aware */}
      <div
        className="px-4 pt-4 shrink-0"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={onFinalComplete}
          id="final-continue-btn"
          className="w-full rounded-2xl py-3.5 font-bold text-sm bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
