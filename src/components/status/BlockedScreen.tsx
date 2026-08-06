"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { PartnerStatus } from "@/lib/api/types";

const COPY: Record<string, { title: string; description: string }> = {
  SUSPENDED: {
    title: "Your account is suspended",
    description: "Your partner account has been temporarily suspended. Contact support for details.",
  },
  REJECTED: {
    title: "Application not approved",
    description: "Your partner application was not approved. Contact support if you think this is a mistake.",
  },
  DEACTIVATED: {
    title: "Account deactivated",
    description: "Your partner account has been deactivated. Contact support to reactivate it.",
  },
};

export default function BlockedScreen({ status }: { status: PartnerStatus }) {
  const { logout } = useAuth();
  const copy = COPY[status] ?? {
    title: "Access restricted",
    description: "Your account currently can't access the partner dashboard.",
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-8 text-center bg-white animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <ShieldAlert className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="text-xl font-extrabold text-stone-900 mb-2">{copy.title}</h1>
      <p className="text-sm text-stone-500 leading-relaxed max-w-xs mb-8">{copy.description}</p>

      <button
        onClick={() => logout()}
        className="rounded-2xl border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-95 cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
