'use client';

import React from "react";
import { Home, IndianRupee, User } from "lucide-react";

interface BottomNavProps {
  active?: "home" | "money" | "profile";
  onNavigate?: (tab: "home" | "money" | "profile") => void;
}

export default function BottomNav({ active = "home", onNavigate }: BottomNavProps) {
  const tabs = [
    { key: "home" as const, label: "Home", Icon: Home },
    { key: "money" as const, label: "Money", Icon: IndianRupee },
    { key: "profile" as const, label: "Profile", Icon: User },
  ];

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-full sm:max-w-sm md:max-w-md flex lg:hidden items-center justify-around border"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "#EBEAE6",
        borderRadius: "28px",
        paddingTop: "8px",
        paddingBottom: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate?.(key)}
            className="flex flex-col items-center gap-1 sm:gap-1.5 px-3 sm:px-4 md:px-5 cursor-pointer transition-all active:scale-95"
          >
            <Icon
              size={20}
              className="sm:hidden"
              strokeWidth={isActive ? 2.2 : 1.8}
              color={isActive ? "#C9851A" : "#9CA3AF"}
              fill={isActive ? "#C9851A" : "none"}
            />
            <Icon
              size={22}
              className="hidden sm:block md:hidden"
              strokeWidth={isActive ? 2.2 : 1.8}
              color={isActive ? "#C9851A" : "#9CA3AF"}
              fill={isActive ? "#C9851A" : "none"}
            />
            <Icon
              size={24}
              className="hidden md:block"
              strokeWidth={isActive ? 2.2 : 1.8}
              color={isActive ? "#C9851A" : "#9CA3AF"}
              fill={isActive ? "#C9851A" : "none"}
            />
            <span
              className="text-[9px] sm:text-[10px] md:text-[11px] font-bold tracking-wide"
              style={{ color: isActive ? "#C9851A" : "#A8A29E" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}