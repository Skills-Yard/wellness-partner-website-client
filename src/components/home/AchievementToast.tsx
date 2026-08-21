"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

interface Achievement {
  title: string;
  subtitle?: string;
}

/**
 * Small state machine behind the bottom-right achievement toast — call
 * `showAchievement` from wherever a lesson/course/course-set finishes.
 * Auto-dismisses after a few seconds; a new achievement while one is still
 * showing just replaces it (no queue — this is meant to be a quick, low-key
 * reaction, not something the partner has to manage).
 */
export function useAchievementToast() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAchievement = (title: string, subtitle?: string) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setAchievement({ title, subtitle });
    dismissTimerRef.current = setTimeout(() => setAchievement(null), 3200);
  };

  // Clear the pending timer if the component using this hook unmounts mid-toast.
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  return { achievement, showAchievement };
}

/** The toast itself — fixed bottom-right, same cream/gold theme as the rest of the app. */
export function AchievementToast({ achievement }: { achievement: Achievement | null }) {
  if (!achievement) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] max-w-[calc(100%-2.5rem)] sm:max-w-xs animate-fade-in-up">
      <div className="flex items-center gap-3 rounded-2xl border border-[#F0DDBF] bg-white shadow-lg px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-[#FDF3E7] flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-[#C9851A]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-stone-900 truncate">{achievement.title}</p>
          {achievement.subtitle && <p className="text-[11px] text-stone-500 truncate">{achievement.subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
