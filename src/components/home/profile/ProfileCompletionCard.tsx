"use client";

import React from "react";
import { Check } from "lucide-react";

interface ChecklistItem {
  label: string;
  done: boolean;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-[72px] h-[72px] shrink-0">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#F0DDBF" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#C9851A"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-extrabold text-stone-900">{percent}%</span>
      </div>
    </div>
  );
}

/** Real completion, computed from the actual checklist passed in — no
 *  fabricated percentage. See DesktopProfilePage for what each item
 *  actually checks. */
export default function ProfileCompletionCard({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[#F5E3C6] bg-[#FFF8EC] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-stone-900">Your Profile</p>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Keep your information updated to get more bookings and build trust.
          </p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <ProgressRing percent={percent} />
          <span className="text-[10px] font-bold text-stone-400 mt-1 whitespace-nowrap">Profile Complete</span>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 py-1.5">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                item.done ? "bg-green-500" : "border-2 border-stone-300"
              }`}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-xs font-semibold ${item.done ? "text-stone-700" : "text-stone-500"}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
