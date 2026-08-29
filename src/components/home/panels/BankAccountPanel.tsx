"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { ApiError } from "@/lib/api/client";
import type { BankAccount } from "@/lib/api/types";

// RBI IFSC format: 4-letter bank code, a reserved '0', then a 6-char branch
// code. Strict, but the form now spells that out instead of just greying the
// Save button with no explanation (see fieldErrors / showErrors below).
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type FieldKey = "accountHolderName" | "accountNumber" | "ifscCode" | "bankName";

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
  // Flipped on the first blocked save attempt so per-field errors surface
  // only after an actual submit, not on first keystroke.
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
      })
      .catch(() => {
        // no bank account on file yet — that's fine, form starts empty
      })
      .finally(() => setLoaded(true));
  }, []);

  const fieldErrors = useMemo<Record<FieldKey, string | null>>(() => {
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
      });
      setAccount(acc);
      setSaved(true);
      setShowErrors(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your bank details.");
    } finally {
      setSaving(false);
    }
  };

  // IFSC format feedback is worth showing while typing; "required" messages
  // only once a save has been attempted.
  const fieldError = (key: FieldKey) => {
    const message = fieldErrors[key];
    if (!message) return null;
    if (key === "ifscCode" && ifscCode.trim() && !IFSC_PATTERN.test(ifscCode.trim().toUpperCase())) {
      return message;
    }
    return showErrors ? message : null;
  };

  const fields: { key: FieldKey; label: string; value: string; set: (v: string) => void }[] = [
    { key: "accountHolderName", label: "Account holder name", value: accountHolderName, set: setAccountHolderName },
    { key: "accountNumber", label: "Account number", value: accountNumber, set: (v) => setAccountNumber(v.replace(/\D/g, "")) },
    { key: "ifscCode", label: "IFSC code", value: ifscCode, set: (v) => setIfscCode(v.toUpperCase()) },
    { key: "bankName", label: "Bank name", value: bankName, set: setBankName },
  ];

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
        <div className="px-5 max-w-md w-full mx-auto space-y-4">
          {account?.isVerified && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
              <ShieldCheck className="h-4 w-4" /> Verified by Eezit
            </div>
          )}

          {fields.map((f) => {
            const err = fieldError(f.key);
            return (
              <div key={f.key}>
                <p className="text-xs font-bold text-stone-800 mb-1.5">{f.label}</p>
                <div
                  className={`rounded-xl border bg-[#F9F6F0] px-4 py-3 transition-all focus-within:bg-white ${
                    err ? "border-red-300 focus-within:border-red-400" : "border-stone-200 focus-within:border-amber-500"
                  }`}
                >
                  <input
                    value={f.value}
                    inputMode={f.key === "accountNumber" ? "numeric" : undefined}
                    maxLength={f.key === "ifscCode" ? 11 : undefined}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full outline-none text-sm text-stone-900 bg-transparent"
                  />
                </div>
                {err && <p className="mt-1 text-[11px] font-medium text-red-500">{err}</p>}
              </div>
            );
          })}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          {showErrors && !isValid && !error && (
            <p className="text-xs font-medium text-red-500">Fix the highlighted fields to continue.</p>
          )}
          {saved && <p className="text-xs font-medium text-green-600">Saved.</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-2xl py-3.5 font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              saving
                ? "bg-stone-100 text-stone-300 cursor-not-allowed"
                : "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
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
