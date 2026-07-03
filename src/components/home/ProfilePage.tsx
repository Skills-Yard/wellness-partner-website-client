'use client';

import React from "react";
import DesktopNav from "./DesktopNav";
import { ArrowLeft, ChevronRight, Briefcase, LayoutDashboard, Wallet, Banknote, GraduationCap, HelpCircle, Gift, ShoppingBag, Send, Globe } from "lucide-react";

interface ProfilePageProps {
  city: string;
  profession: string;
  onLogout: () => void;
  activeTab: "home" | "money" | "profile";
  onNavigate: (tab: "home" | "money" | "profile") => void;
}

export default function ProfilePage({
  city,
  profession,
  onLogout,
  activeTab,
  onNavigate,
}: ProfilePageProps) {

  const MENU_GROUP_1 = [
    { label: "Job History", icon: <Briefcase className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "My Hub", icon: <LayoutDashboard className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Credits", icon: <Wallet className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Loans", icon: <Banknote className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Training", icon: <GraduationCap className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Help Center", icon: <HelpCircle className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Invite a friend to Vellora", icon: <Gift className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
    { label: "Vellora Shop", icon: <ShoppingBag className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans lg:pb-0">
      <DesktopNav active={activeTab} onNavigate={onNavigate} />

      {/* ── Top Header with Back button ── */}
      <div className="px-5 pt-6 pb-2">
        <div
          onClick={() => onNavigate("home")}
          className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="px-5 pt-2 pb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-sm border border-stone-100">
          <img src="/images/avatar-shruti.png" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-stone-900 tracking-tight leading-snug">Shruti Sharma</h1>
          <div className="flex items-center gap-1 bg-[#FDF8F3] px-2 py-0.5 mt-1 rounded-full w-fit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#C9851A">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-bold text-[#C9851A]">Vellora Partner</span>
          </div>
        </div>
      </div>

      {/* ── Settings Cards ── */}
      <div className="px-5 flex flex-col gap-4">

        {/* Card 1 */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col p-2">
          {MENU_GROUP_1.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FDF8F3] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-stone-850">{item.label}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          ))}
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col p-2 mb-8">
          <div className="flex items-center justify-between px-3 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF8F3] flex items-center justify-center shrink-0">
                <span className="text-[#C9851A] font-extrabold text-lg">₹</span>
              </div>
              <div>
                <div className="text-sm font-bold text-stone-850 leading-tight">Financial details</div>
                <div className="text-[10px] text-stone-500 font-medium">GST, PAN & bank information</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div className="flex items-center justify-between px-3 py-3 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF8F3] flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-850 leading-tight">Send Whatsapp updates</div>
                <div className="text-[10px] text-stone-500 font-medium">On</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FDF8F3] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-[#C9851A]" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-bold text-stone-850 leading-tight">Change language</div>
                <div className="text-[10px] text-stone-500 font-medium">English</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      {/* ── Footer Section ── */}
      <div className="bg-[#FAF7F2] flex-1 px-8 pt-8 pb-12 rounded-t-3xl border-t border-stone-100 flex flex-col gap-4 text-xs font-semibold">
        <a href="#" className="text-[#C9851A] font-bold text-sm mb-1 hover:underline">Contact us</a>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors">Terms of use</a>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors">Privacy policy</a>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors">Welfare policy</a>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors">Rate us on the App Store</a>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors">Download the Vellora Partner app</a>
        <button
          onClick={onLogout}
          className="text-stone-500 text-left hover:text-red-500 transition-colors mt-2"
        >
          Logout
        </button>
        <a href="#" className="text-stone-500 hover:text-stone-800 transition-colors mt-2">Delete account</a>
      </div>

    </div>
  );
}
