'use client';

import React from "react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import { ChevronLeft, ChevronRight, Settings, Bell, Calendar, Wallet, Banknote, Clock, ArrowRight, User } from "lucide-react";

interface MoneyPageProps {
  activeTab: "home" | "money" | "profile";
  onNavigate: (tab: "home" | "money" | "profile") => void;
}

export default function MoneyPage({ activeTab, onNavigate }: MoneyPageProps) {
  return (
    <div className="min-h-screen bg-[#FDFDFC] flex flex-col pb-28 lg:pb-0 text-stone-900 font-sans">
      <DesktopNav active={activeTab} onNavigate={onNavigate} />
      
      {/* ── Top bar ── */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <User className="h-5 w-5 text-stone-600" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#F5E6D3] rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
            <Settings className="h-5 w-5 text-[#C9851A]" strokeWidth={1.5} />
          </div>
          <div className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
            <Bell className="h-5 w-5 text-stone-600" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-2">
        <h1 className="text-xl font-extrabold tracking-tight">Money</h1>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col gap-5">
        
        {/* ── Earnings Card ── */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50">
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600 tracking-tight">₹7,390</div>
              <div className="text-[11px] font-bold text-stone-600 mt-1">23 June - 3 July</div>
            </div>
            <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center cursor-pointer hover:bg-stone-50">
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="h-24 mt-6 flex items-end gap-2 border-b-2 border-green-500/80 px-2">
            <div className="w-1/3 bg-green-100 rounded-t-lg h-[90%]"></div>
            <div className="w-1/3 bg-green-100 rounded-t-lg h-[60%]"></div>
            <div className="w-1/3 bg-green-100 rounded-t-lg h-[80%]"></div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-stone-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Next payout on 3 July</span>
          </div>
        </div>

        {/* ── Breakdown Card ── */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-5 py-2">
          {[
            { title: "Job Hours", sub: "6 hours", amount: "₹2,163" },
            { title: "Job Hours", sub: "7 hours", amount: "₹2,443" },
            { title: "Job Hours", sub: "8 hours", amount: "₹2,784" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-4 border-b border-stone-50 last:border-b-0">
              <div>
                <div className="text-xs font-bold">{item.title}</div>
                <div className="text-[10px] text-stone-500">{item.sub}</div>
              </div>
              <div className="text-xs font-bold">{item.amount}</div>
            </div>
          ))}
          <div className="flex items-center justify-between py-4 border-t border-stone-100">
            <div className="text-sm font-extrabold">Total</div>
            <div className="text-sm font-extrabold">₹7,390</div>
          </div>
        </div>

        {/* ── Bank transfers Section ── */}
        <div>
          <h2 className="text-sm font-extrabold px-1 mb-3">Bank transfers</h2>
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="w-20 h-14 relative -ml-2">
                <img src="/images/wallet_transfers.png" alt="Wallet" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-1 text-[#C9851A] pr-2">
                <span className="text-xs font-bold">See all</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">PENDING DEDUCTIONS</div>
                  <div className="text-sm font-extrabold">₹0</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* ── Explore more Section ── */}
        <div>
          <h2 className="text-sm font-extrabold px-1 mb-3">Explore more</h2>
          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col">
            {[
              { title: "Loans", sub: "No loans available", icon: <Wallet className="w-5 h-5" /> },
              { title: "Recoveries", sub: "0 recoveries active", icon: <Clock className="w-5 h-5" /> },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border-b border-stone-50 cursor-pointer hover:bg-stone-50 transition-colors last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10px] text-stone-500">{item.sub}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-3 p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF5E6] flex items-center justify-center text-[#C9851A]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold">Credits</div>
                <div className="text-[10px] text-stone-500">₹0</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
