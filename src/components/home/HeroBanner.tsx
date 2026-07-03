'use client';

import React from "react";
import { Bell, User } from "lucide-react";

/**
 * Shared HeroBanner — full-bleed background photo (couple in spa setting)
 * with a dark gradient overlay for text legibility.
 * Full width on ALL screens (mobile → laptop → desktop).
 * Height is fluid but capped so it doesn't stretch too tall on wide screens.
 */
export default function HeroBanner() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "clamp(190px, 26vw, 360px)",
      }}
    >
      {/* Full background photo */}
      <img
        src="/images/vellora-hero-banner.png"
        alt="Vellora Partners"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "78% 22%" }}
      />

      {/* Dark gradient overlay for text readability — strongest on the left */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(50,32,8,0.88) 0%, rgba(60,38,10,0.7) 35%, rgba(60,38,10,0.25) 60%, rgba(30,18,5,0.1) 100%)",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 h-full flex flex-col mx-auto w-full"
        style={{
          maxWidth: "1280px",
          paddingLeft: "clamp(14px, 4vw, 48px)",
          paddingRight: "clamp(14px, 4vw, 48px)",
          paddingTop: "clamp(10px, 2.5vw, 20px)",
          paddingBottom: "clamp(10px, 2.5vw, 20px)",
        }}
      >
        {/* ── Top bar ── */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ marginBottom: "clamp(8px, 2vw, 14px)" }}
        >
          <div
            className="bg-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-stone-50 transition-colors"
            style={{ width: "clamp(30px, 6vw, 42px)", height: "clamp(30px, 6vw, 42px)" }}
          >
            <User
              className="text-stone-700"
              strokeWidth={1.8}
              style={{ width: "clamp(13px, 2.6vw, 17px)", height: "clamp(13px, 2.6vw, 17px)" }}
            />
          </div>

          {/* Centred VELLORA logo */}
          <div className="flex flex-col items-center gap-0.5">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              style={{ width: "clamp(22px, 4.5vw, 30px)", height: "clamp(22px, 4.5vw, 30px)" }}
            >
              <path
                d="M14 2C14 2 8 8 8 14c0 3.314 2.686 6 6 6s6-2.686 6-6c0-6-6-12-6-12Z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M14 8C14 8 10 12 10 15.5c0 2.21 1.79 4 4 4s4-1.79 4-4C18 12 14 8 14 8Z"
                fill="#C9851A"
              />
            </svg>
            <span
              className="text-white font-extrabold tracking-[0.2em] leading-none drop-shadow-md"
              style={{ fontSize: "clamp(8.5px, 1.6vw, 11.5px)" }}
            >
              VELLORA
            </span>
          </div>

          <div
            className="bg-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-stone-50 transition-colors"
            style={{ width: "clamp(30px, 6vw, 42px)", height: "clamp(30px, 6vw, 42px)" }}
          >
            <Bell
              className="text-stone-700"
              strokeWidth={1.8}
              style={{ width: "clamp(13px, 2.6vw, 17px)", height: "clamp(13px, 2.6vw, 17px)" }}
            />
          </div>
        </div>

        {/* ── Hero text — bottom aligned over the photo ── */}
        <div
          className="flex-1 flex flex-col justify-end min-w-0"
          style={{ maxWidth: "clamp(280px, 40vw, 480px)" }}
        >
          <p
            className="font-bold uppercase tracking-widest text-[#FFD580] drop-shadow-md"
            style={{ fontSize: "clamp(9px, 1.4vw, 13px)", marginBottom: "clamp(2px, 0.5vw, 5px)" }}
          >
            Be Your Own Boss
          </p>
          <p
            className="font-semibold text-white/90 leading-none drop-shadow-md"
            style={{ fontSize: "clamp(10px, 1.5vw, 14px)", marginBottom: "clamp(1px, 0.4vw, 3px)" }}
          >
            Earn upto
          </p>
          <p
            className="font-black leading-none text-[#FFD580] drop-shadow-lg"
            style={{ fontSize: "clamp(22px, 4vw, 46px)", marginBottom: "clamp(6px, 1.3vw, 12px)" }}
          >
            ₹70,000
          </p>
          <p
            className="text-white/90 leading-snug drop-shadow-md"
            style={{ fontSize: "clamp(9px, 1.4vw, 13px)" }}
          >
            Join 7,000+ partners across 55+ cities in India.
          </p>

          {/* Stat pills */}
          <div
            className="flex flex-wrap"
            style={{ gap: "clamp(4px, 0.8vw, 8px)", marginTop: "clamp(10px, 1.8vw, 18px)" }}
          >
            {[
              {
                icon: (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                ),
                label: "7,000+ Partners",
              },
              {
                icon: (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                ),
                label: "55+ Cities",
              },
              {
                icon: (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
                label: "₹70K/mo",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center bg-black/30 backdrop-blur-sm rounded-full border border-white/15"
                style={{
                  gap: "clamp(3px, 0.6vw, 6px)",
                  paddingLeft: "clamp(5px, 0.9vw, 8px)",
                  paddingRight: "clamp(8px, 1.4vw, 12px)",
                  paddingTop: "clamp(3px, 0.5vw, 6px)",
                  paddingBottom: "clamp(3px, 0.5vw, 6px)",
                }}
              >
                <div
                  className="bg-white/15 rounded-full flex items-center justify-center text-[#FFD580] shrink-0"
                  style={{ width: "clamp(16px, 2.4vw, 23px)", height: "clamp(16px, 2.4vw, 23px)" }}
                >
                  {s.icon}
                </div>
                <span
                  className="font-bold text-white/95 tracking-wide whitespace-nowrap"
                  style={{ fontSize: "clamp(7.5px, 1.2vw, 11px)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}