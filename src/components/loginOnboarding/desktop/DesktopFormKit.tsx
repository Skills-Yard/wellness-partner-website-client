"use client";

import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

/** The white rounded card every desktop wizard step renders inside — kept
 *  as one shared shell so title/subtitle/error placement stays consistent
 *  across steps that otherwise have very different form content. Centered,
 *  header-inside-the-card is the default (phone/OTP/partner-type/partner-
 *  details); the wide, denser steps (KYC, review) read better with the
 *  title left-aligned above the card instead, with room for a header-right
 *  slot (KYC's "your information is safe" badge) — set headerOutsideCard
 *  for those. */
export function DesktopStepCard({
  title,
  subtitle,
  wide,
  align = "center",
  headerOutsideCard = false,
  headerRight,
  error,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  align?: "center" | "left";
  headerOutsideCard?: boolean;
  headerRight?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  const header = (
    <div className={align === "center" ? "text-center" : "flex items-start justify-between gap-6"}>
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">{title}</h1>
        {subtitle && <p className="text-sm text-stone-500 mt-1.5">{subtitle}</p>}
      </div>
      {headerRight}
    </div>
  );

  if (headerOutsideCard) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">{header}</div>
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 sm:p-10">
          {children}
          {error && <p className="mt-4 text-xs font-medium text-red-500 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full mx-auto bg-white rounded-3xl border border-stone-100 shadow-sm p-8 sm:p-10 ${
        wide ? "max-w-4xl" : "max-w-md"
      }`}
    >
      <div className="mb-7">{header}</div>
      {children}
      {error && <p className="mt-4 text-xs font-medium text-red-500 text-center">{error}</p>}
    </div>
  );
}

export function DesktopPrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  full = true,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${
        full ? "w-full" : "px-10"
      } rounded-xl py-3 font-bold text-sm bg-[#C9851A] text-white hover:bg-[#B67714] shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function DesktopBackLink({ onClick, label = "Back" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-bold text-stone-500 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
    >
      ← {label}
    </button>
  );
}

/** A bordered white button — the "Back" style the wide KYC/review steps use
 *  (their footer sits beside a solid primary button, so a plain text link
 *  reads too quiet there); the narrower steps keep DesktopBackLink. */
export function DesktopSecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  );
}

/** Back link, optionally alongside another action on the same row (e.g. a
 *  secondary button) — the footer shape most desktop steps use below their
 *  main button. */
export function DesktopStepFooter({
  onBack,
  backLabel,
  children,
}: {
  onBack?: () => void;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      {onBack && <DesktopBackLink onClick={onBack} label={backLabel} />}
      {children}
    </div>
  );
}
