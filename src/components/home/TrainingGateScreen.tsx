"use client";

import React from "react";
import { LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import TrainingCenter from "./TrainingCenter";
import type { Partner } from "@/lib/api/types";

/**
 * Full replacement for the dashboard while partner.status === "TRAINING" —
 * mandatory training isn't done yet, so nothing else (bookings, money,
 * profile, ...) is reachable: the sidebar carries only a "Training" marker
 * (no other nav items — see Sidebar's trainingOnly prop) and there's no
 * BottomNav at all, just this screen. Once every mandatory course is
 * completed the partner's status moves to PENDING_APPROVAL/APPROVED and
 * DashboardContent (dashboard.tsx) hands off to the real PartnerHomescreen,
 * where "Training" becomes a normal sidebar item for rewatching (see
 * TrainingCenter's onBack-driven review mode).
 */
export default function TrainingGateScreen({ partner, onLogout }: { partner: Partner; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <Sidebar
        partner={partner}
        activeView="training"
        isApproved={false}
        trainingOnly
        onNavigateTab={() => {}}
        onOpenSubView={() => {}}
        onOpenNotifications={() => {}}
        onLogout={onLogout}
      />

      {/* No Sidebar below lg — this slim bar carries the logo + a way to log out instead */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-[#C9851A] to-[#FFD580] flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z" fill="white" />
            </svg>
          </div>
          <span className="font-extrabold text-stone-900 tracking-wide text-xs">EEZIT PARTNER</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <TrainingCenter partner={partner} />
      </div>
    </div>
  );
}
