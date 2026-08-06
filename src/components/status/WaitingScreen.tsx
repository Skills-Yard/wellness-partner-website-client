"use client";

import React, { useState } from "react";
import { RefreshCw, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

interface WaitingScreenProps {
  title: string;
  description: string;
}

export default function WaitingScreen({ title, description }: WaitingScreenProps) {
  const { refreshProfile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 text-center bg-white animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-[#FDF3E7] flex items-center justify-center mb-5">
        <Clock3 className="h-7 w-7 text-[#C9851A]" />
      </div>
      <h1 className="text-xl font-extrabold text-stone-900 mb-2">{title}</h1>
      <p className="text-sm text-stone-500 leading-relaxed max-w-xs mb-8">{description}</p>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center gap-2 rounded-2xl border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 cursor-pointer mb-4"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh status
      </button>

      <button
        onClick={() => logout()}
        className="text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
