"use client";

import React, { useEffect, useState } from "react";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { BankAccount } from "@/lib/api/types";

const ACCOUNT_TYPES = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
];

/**
 * Same GET/PUT bank-account endpoints as BankAccountPanel (the sidebar-
 * reachable version, left untouched for mobile) — this is a separate,
 * desktop-only implementation rather than that component reused inside a
 * tab, since BankAccountPanel renders its own full-screen header/back
 * button that wouldn't make sense nested under a tab here. The one field
 * this version adds that BankAccountPanel doesn't: accountType, which the
 * API has always accepted but no form previously exposed.
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

  useEffect(() => {
    partnerApi
      .getBankAccount()
      .then((acc) => {
        setAccount(acc);
        setAccountHolderName(acc.accountHolderName);
        setAccountNumber(acc.accountNumber);
        setIfscCode(acc.ifscCode);
        setBankName(acc.bankName);
        setAccountType(acc.accountType || "savings");
      })
      .catch(() => {
        // no bank account on file yet — form starts empty
      })
      .finally(() => setLoaded(true));
  }, []);

  const isValid = Boolean(
    accountHolderName.trim() &&
      accountNumber.trim() &&
      /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase()) &&
      bankName.trim()
  );

  const handleSave = async () => {
    if (!isValid || saving) return;
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
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Account Number</p>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">IFSC Code</p>
          <input
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Bank Name</p>
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
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
      {saved && <p className="mt-4 text-xs font-medium text-green-600">Saved.</p>}

      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className={`mt-5 rounded-xl px-6 py-2.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
          isValid && !saving
            ? "bg-[#C9851A] text-white hover:bg-[#B67714] shadow-md cursor-pointer"
            : "bg-stone-100 text-stone-300 cursor-not-allowed"
        }`}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save Bank Details
      </button>
    </div>
  );
}
