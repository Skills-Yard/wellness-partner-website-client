"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { BankAccount } from "@/lib/api/types";

export default function BankAccountPanel({ onBack }: { onBack: () => void }) {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

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
      })
      .catch(() => {
        // no bank account on file yet — that's fine, form starts empty
      })
      .finally(() => setLoaded(true));
  }, []);

  const isValid = Boolean(
    accountHolderName.trim() && accountNumber.trim() && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase()) && bankName.trim()
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
      });
      setAccount(acc);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your bank details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Bank account</h1>
      </div>

      {!loaded ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
        </div>
      ) : (
        <div className="px-5 max-w-md w-full space-y-4">
          {account?.isVerified && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
              <ShieldCheck className="h-4 w-4" /> Verified by Vellora
            </div>
          )}

          {[
            { label: "Account holder name", value: accountHolderName, set: setAccountHolderName },
            { label: "Account number", value: accountNumber, set: setAccountNumber },
            { label: "IFSC code", value: ifscCode, set: setIfscCode },
            { label: "Bank name", value: bankName, set: setBankName },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-xs font-bold text-stone-800 mb-1.5">{f.label}</p>
              <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
                <input
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full outline-none text-sm text-stone-900 bg-transparent"
                />
              </div>
            </div>
          ))}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          {saved && <p className="text-xs font-medium text-green-600">Saved.</p>}

          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className={`w-full rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              isValid && !saving
                ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
            }`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save bank details
          </button>
        </div>
      )}
    </div>
  );
}
