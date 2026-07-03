'use client';

import React from "react";

interface BottomNavProps {
  active?: "home" | "money" | "profile";
  onNavigate?: (tab: "home" | "money" | "profile") => void;
}

export default function BottomNav({ active = "home", onNavigate }: BottomNavProps) {
  const tabs = [
    {
      key: "home" as const,
      label: "Home",
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
            fill={isActive ? "#C9851A" : "none"}
            stroke={isActive ? "#C9851A" : "#9CA3AF"}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 21V12h6v9"
            stroke={isActive ? "#C9851A" : "#9CA3AF"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      key: "money" as const,
      label: "Money",
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke={isActive ? "#C9851A" : "#9CA3AF"}
            strokeWidth="1.8"
          />
          <text
            x="12"
            y="16.5"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={isActive ? "#C9851A" : "#9CA3AF"}
            fontFamily="sans-serif"
          >
            ₹
          </text>
        </svg>
      ),
    },
    {
      key: "profile" as const,
      label: "Profile",
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="8"
            r="4"
            fill={isActive ? "#C9851A" : "none"}
            stroke={isActive ? "#C9851A" : "#9CA3AF"}
            strokeWidth="1.8"
          />
          <path
            d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
            stroke={isActive ? "#C9851A" : "#9CA3AF"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="sticky bottom-0 z-50 w-full flex items-center justify-around border-t"
      style={{
        background: "#FFFFFF",
        borderTopColor: "#F1F0EE",
        paddingTop: "10px",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate?.(tab.key)}
            className="flex flex-col items-center gap-1 px-6 cursor-pointer transition-all active:scale-95"
          >
            {tab.icon(isActive)}
            <span
              className="text-[10px] font-semibold"
              style={{ color: isActive ? "#C9851A" : "#9CA3AF" }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
