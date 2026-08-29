"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { BankAccount } from "@/lib/api/types";

const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
];

// RBI IFSC format: 4-letter bank code, a reserved '0', then a 6-char branch
// code. Kept strict, but the form now says so out loud instead of just
// greying the button (see fieldErrors / showErrors below).
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Same GET/PUT bank-account endpoints as BankAccountPanel (the sidebar-
 * reachable version) — this is a separate, desktop-only implementation
 * rather than that component reused inside a tab, since BankAccountPanel
 * renders its own full-screen header/back button that wouldn't make sense
 * nested under a tab here. The one field this version adds that
 * BankAccountPanel doesn't: accountType, which the API has always accepted
 * but no form previously exposed.
 */
export default function BankingDetailsTab({ onSaved }: { onSaved?: (account: BankAccount) => void }) {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("savings");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Flipped on the first blocked save attempt so per-field errors surface
  // only after the partner has actually tried to submit, not while they're
  // still typing the first character.
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    partnerApi
      .getBankAccount()
      .then((acc) => {
        setAccount(acc);
        setAccountHolderName(acc.accountHolderName);
        setAccountNumber(acc.accountNumber);
        setIfscCode(acc.ifscCode);
        setBankName(acc.bankName);
        setAccountType((acc.accountType || "savings").toLowerCase());
      })
      .catch(() => {
        // no bank account on file yet — form starts empty
      })
      .finally(() => setLoaded(true));
  }, []);

  const fieldErrors = useMemo(() => {
    const ifsc = ifscCode.trim().toUpperCase();
    return {
      accountHolderName: accountHolderName.trim() ? null : "Enter the account holder's name.",
      accountNumber: accountNumber.trim() ? null : "Enter the account number.",
      ifscCode: !ifsc
        ? "Enter the IFSC code."
        : IFSC_PATTERN.test(ifsc)
        ? null
        : "That doesn't look like a valid IFSC (e.g. HDFC0001234).",
      bankName: bankName.trim() ? null : "Enter the bank name.",
    };
  }, [accountHolderName, accountNumber, ifscCode, bankName]);

  const isValid = !Object.values(fieldErrors).some(Boolean);

  const handleSave = async () => {
    if (saving) return;
    if (!isValid) {
      setShowErrors(true);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const acc = await partnerApi.upsertBankAccount({
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim(),
        accountType,
      });
      setAccount(acc);
      setSaved(true);
      setShowErrors(false);
      onSaved?.(acc);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your bank details.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  // IFSC format feedback is useful while typing; the "required" errors only
  // make sense once a save has been attempted.
  const fieldError = (key: keyof typeof fieldErrors) => {
    const message = fieldErrors[key];
    if (!message) return null;
    if (key === "ifscCode" && ifscCode.trim() && !IFSC_PATTERN.test(ifscCode.trim().toUpperCase())) {
      return message;
    }
    return showErrors ? message : null;
  };

  const inputClass = (key: keyof typeof fieldErrors) =>
    `w-full rounded-xl border bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:bg-white transition-all ${
      fieldError(key) ? "border-red-300 focus:border-red-400" : "border-stone-200 focus:border-amber-500"
    }`;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-stone-900">Banking Details</p>
          <p className="text-xs text-stone-400">Add your bank account details to receive payments.</p>
        </div>
      </div>

      {account?.isVerified && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 mb-4">
          <ShieldCheck className="h-4 w-4" /> Verified by Eezit
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Account Holder Name</p>
          <input
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            className={inputClass("accountHolderName")}
          />
          {fieldError("accountHolderName") && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{fieldError("accountHolderName")}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Account Number</p>
          <input
            value={accountNumber}
            inputMode="numeric"
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            className={inputClass("accountNumber")}
          />
          {fieldError("accountNumber") && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{fieldError("accountNumber")}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">IFSC Code</p>
          <input
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            maxLength={11}
            className={inputClass("ifscCode")}
          />
          {fieldError("ifscCode") && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{fieldError("ifscCode")}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Bank Name</p>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className={inputClass("bankName")}
          />
          {fieldError("bankName") && (
            <p className="mt-1 text-[11px] font-medium text-red-500">{fieldError("bankName")}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Account Type</p>
          <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 focus-within:bg-white focus-within:border-amber-500 transition-all">
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full outline-none text-sm text-stone-900 bg-transparent"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}
      {showErrors && !isValid && !error && (
        <p className="mt-4 text-xs font-medium text-red-500">Fix the highlighted fields to continue.</p>
      )}
      {saved && <p className="mt-4 text-xs font-medium text-green-600">Saved.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-5 rounded-xl px-6 py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
          saving
            ? "bg-stone-100 text-stone-300 cursor-not-allowed"
            : "bg-[#C9851A] text-white hover:bg-[#B67714] shadow-md cursor-pointer"
        }`}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Bank Details
      </button>
    </div>
  );
}
