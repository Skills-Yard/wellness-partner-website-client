'use client';

import React from "react";
import {
  ArrowLeft,
  ChevronRight,
  Briefcase,
  LayoutDashboard,
  Wallet,
  Banknote,
  GraduationCap,
  HelpCircle,
  Gift,
  ShoppingBag,
  MessageCircle,
  Globe,
  BadgeCheck,
} from "lucide-react";
import type { Partner } from "@/lib/api/types";
import PartnerAvatar from "./PartnerAvatar";

interface ProfilePageProps {
  partner: Partner;
  onLogout: () => void;
  onBack: () => void;
  onOpenBankAccount: () => void;
}

// Mobile-only redesign to match the latest Figma spec (menu cards on a
// subtle hairline border instead of a shadow, 8px radius, the muted
// #D38516/#666666/#F9F4EE palette) — DesktopProfilePage is a separate,
// intentionally different component and isn't touched by this.
export default function ProfilePage({
  partner,
  onLogout,
  onBack,
  onOpenBankAccount,
}: ProfilePageProps) {

  const MENU_GROUP_1 = [
    { label: "Job History", icon: <Briefcase className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "My Hub", icon: <LayoutDashboard className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Credits", icon: <Wallet className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Loans", icon: <Banknote className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Training", icon: <GraduationCap className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Help Center", icon: <HelpCircle className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Invite a friend to Vellora", icon: <Gift className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
    { label: "Vellora Shop", icon: <ShoppingBag className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-28 lg:pb-10">
      {/* ── Top Header with Back button ── */}
      <div className="px-4 pt-6 pb-2">
        <div
          onClick={onBack}
          className="w-8.5 h-8.5 border border-stone-200 rounded flex items-center justify-center bg-white cursor-pointer hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-black" strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="px-4 pt-4 pb-6 flex items-center gap-1.5">
        <PartnerAvatar
          partner={partner}
          className="size-17.75 shrink-0 bg-stone-100 text-xl text-stone-400"
        />
        <div className="flex flex-col gap-1.5">
          <h1 className="text-base font-semibold text-black leading-tight">
            {partner.name ?? "Vellora Partner"}
          </h1>
          <div className="flex items-center gap-1 bg-[#F9F4EE] p-2.5 rounded-lg w-fit">
            <BadgeCheck className="size-3.5 text-[#D38516]" fill="none" strokeWidth={2} />
            <span className="text-xs font-medium text-[#D38516]">
              {partner.type === "BUSINESS" ? "Eezit Business Partner" : "Eezit Partner"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Settings Cards ── */}
      <div className="px-4 flex flex-col gap-4">

        {/* Card 1 */}
        <div className="bg-white rounded-lg border-2 border-black/[0.04] flex flex-col p-2">
          {MENU_GROUP_1.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-3 border-b border-black/[0.04] cursor-pointer hover:bg-stone-50 transition-colors last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="size-8.5 rounded-full bg-[#FDFAF5] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="text-sm font-medium text-black">{item.label}</div>
              </div>
              <ChevronRight className="size-5.5 text-[#666666]" />
            </div>
          ))}
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg border-2 border-black/[0.04] flex flex-col p-2 mb-8">
          <div
            onClick={onOpenBankAccount}
            className="flex items-center justify-between px-3 py-3 border-b border-black/[0.04] cursor-pointer hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="size-8.5 rounded-full bg-[#FDFAF5] flex items-center justify-center shrink-0">
                <span className="text-[#D38516] font-semibold text-lg">₹</span>
              </div>
              <div>
                <div className="text-sm font-medium text-black leading-tight">Financial details</div>
                <div className="text-xs text-[#666666] font-medium">GST, PAN &amp; bank information</div>
              </div>
            </div>
            <ChevronRight className="size-5.5 text-[#666666]" />
          </div>

          <div className="flex items-center justify-between px-3 py-3 border-b border-black/[0.04] cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-8.5 rounded-full bg-[#FDFAF5] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-medium text-black leading-tight">Send Whatsapp updates</div>
                <div className="text-xs text-[#666666] font-medium">{partner.whatsappOptIn ? "On" : "Off"}</div>
              </div>
            </div>
            <ChevronRight className="size-5.5 text-[#666666]" />
          </div>

          <div className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-8.5 rounded-full bg-[#FDFAF5] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-[#D38516]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-medium text-black leading-tight">Change language</div>
                <div className="text-xs text-[#666666] font-medium">English</div>
              </div>
            </div>
            <ChevronRight className="size-5.5 text-[#666666]" />
          </div>
        </div>
      </div>

      {/* ── Footer Section ── */}
      <div className="bg-[#F9F4EE] flex-1 px-4 pt-6 pb-12 flex flex-col gap-4 text-xs font-medium">
        <a href="#" className="text-[#D38516] font-medium text-sm mb-1 hover:underline">Contact us</a>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors">Terms of use</a>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors">Privacy policy</a>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors">Welfare policy</a>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors">Rate us on the App Store</a>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors">Download the Vellora Partner app</a>
        <button
          onClick={onLogout}
          className="text-[#666666] text-left hover:text-red-500 transition-colors mt-2 cursor-pointer"
        >
          Logout
        </button>
        <a href="#" className="text-[#666666] hover:text-stone-800 transition-colors mt-2">Delete account</a>
      </div>

    </div>
  );
}
