'use client';

import React from "react";
import { Home, IndianRupee, User } from "lucide-react";

interface DesktopNavProps {
  active?: "home" | "money" | "profile";
  onNavigate?: (tab: "home" | "money" | "profile") => void;
}

export default function DesktopNav({ active = "home", onNavigate }: DesktopNavProps) {
  const tabs = [
    { key: "home" as const, label: "Home", Icon: Home },
    { key: "money" as const, label: "Money", Icon: IndianRupee },
    { key: "profile" as const, label: "Profile", Icon: User },
  ];

  return (
    <div className="hidden lg:flex w-full h-16 bg-white border-b border-stone-100 items-center justify-between px-8 shadow-sm shrink-0">
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="#C9851A" />
          <path
            d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z"
            fill="white"
          />
        </svg>
        <span className="font-extrabold text-stone-900 tracking-wider">VELLORA</span>
      </div>

      <div className="flex items-center gap-8">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate?.(key)}
              className="flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? "#C9851A" : "#9CA3AF"}
              />
              <span
                className="text-sm font-bold tracking-wide"
                style={{ color: isActive ? "#C9851A" : "#A8A29E" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
