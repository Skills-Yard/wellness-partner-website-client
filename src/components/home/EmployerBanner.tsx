"use client";

import React from "react";
import { Building2, ChevronRight } from "lucide-react";
import type { EmployerLink } from "@/lib/api/types";

/**
 * Shown at the top of the home dashboard when the signed-in partner is an
 * ACTIVE team member of one or more businesses (profile.employers). Purely
 * informational — bookings, availability and payouts still work exactly as
 * they do for any individual partner (see AGENTS notes on the membership
 * feature). Tapping it opens the Memberships panel.
 */
export default function EmployerBanner({
  employers,
  onOpen,
}: {
  employers: EmployerLink[];
  onOpen: () => void;
}) {
  if (!employers.length) return null;

  const names = employers
    .map((e) => e.businessName?.trim())
    .filter((n): n is string => !!n);
  const label =
    names.length === 0
      ? "a business"
      : names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names[0]} +${names.length - 1} more`;

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3.5 rounded-2xl border border-[#D9E5DE] bg-[#F1F7F3] p-4 text-left transition-shadow hover:shadow-md cursor-pointer"
    >
      <span className="w-11 h-11 rounded-xl bg-[#DCEBE2] flex items-center justify-center shrink-0 text-[#3F7A5B]">
        <Building2 className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-stone-900">
          You&apos;re on {label}&apos;s team
        </p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
          {employers.length === 1 && employers[0].role
            ? `Role: ${employers[0].role}. `
            : ""}
          Your bookings, availability and payouts are unchanged.
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-stone-400 shrink-0" />
    </button>
  );
}
