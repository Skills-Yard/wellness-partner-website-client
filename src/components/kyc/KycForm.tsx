"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import DocumentUploadField from "./DocumentUploadField";
import { uploadKycFile } from "@/lib/api/upload";
import * as kycApi from "@/lib/api/kyc";
import { ApiError } from "@/lib/api/client";
import type { BusinessEntityType, PartnerKyc, PartnerType } from "@/lib/api/types";

const BUSINESS_TYPES: { value: BusinessEntityType; label: string }[] = [
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "LLP", label: "LLP" },
  { value: "OTHER", label: "Other" },
];

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-stone-800 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400"
        />
      </div>
    </div>
  );
}

interface KycFormProps {
  partnerType: PartnerType;
  initial: PartnerKyc | null;
  onSubmitted: () => void;
}

export default function KycForm({ partnerType, initial, onSubmitted }: KycFormProps) {
  const [aadhaarNumber, setAadhaarNumber] = useState(initial?.aadhaarNumber ?? "");
  const [aadhaarFrontKey, setAadhaarFrontKey] = useState<string | null>(initial?.aadhaarFrontKey ?? null);
  const [aadhaarBackKey, setAadhaarBackKey] = useState<string | null>(initial?.aadhaarBackKey ?? null);
  const [panNumber, setPanNumber] = useState(initial?.panNumber ?? "");
  const [panKey, setPanKey] = useState<string | null>(initial?.panKey ?? null);
  const [selfieKey, setSelfieKey] = useState<string | null>(initial?.selfieKey ?? null);

  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [businessType, setBusinessType] = useState<BusinessEntityType | "">(initial?.businessType ?? "");
  const [gstin, setGstin] = useState(initial?.gstin ?? "");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(
    initial?.businessRegistrationNumber ?? ""
  );
  const [businessAddress, setBusinessAddress] = useState(initial?.businessAddress ?? "");
  const [businessLicenseKey, setBusinessLicenseKey] = useState<string | null>(
    initial?.businessLicenseKey ?? null
  );
  const [businessPanNumber, setBusinessPanNumber] = useState(initial?.businessPanNumber ?? "");
  const [businessPanKey, setBusinessPanKey] = useState<string | null>(initial?.businessPanKey ?? null);
  const [cancelledChequeKey, setCancelledChequeKey] = useState<string | null>(
    initial?.cancelledChequeKey ?? null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusiness = partnerType === "BUSINESS";

  const isValid = Boolean(
    aadhaarNumber.trim() &&
      aadhaarFrontKey &&
      aadhaarBackKey &&
      panNumber.trim() &&
      panKey &&
      selfieKey &&
      (!isBusiness ||
        (businessName.trim() && businessType && gstin.trim() && businessAddress.trim()))
  );

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await kycApi.submitKyc({
        aadhaarNumber: aadhaarNumber.trim(),
        aadhaarFrontKey: aadhaarFrontKey!,
        aadhaarBackKey: aadhaarBackKey!,
        panNumber: panNumber.trim().toUpperCase(),
        panKey: panKey!,
        selfieKey: selfieKey!,
        ...(isBusiness
          ? {
              businessName: businessName.trim(),
              businessType: businessType as BusinessEntityType,
              gstin: gstin.trim().toUpperCase(),
              businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
              businessAddress: businessAddress.trim(),
              businessLicenseKey: businessLicenseKey ?? undefined,
              businessPanNumber: businessPanNumber.trim().toUpperCase() || undefined,
              businessPanKey: businessPanKey ?? undefined,
              cancelledChequeKey: cancelledChequeKey ?? undefined,
            }
          : {}),
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit your documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
        <h2 className="text-[20px] font-extrabold text-stone-900 mb-1 leading-snug">
          Verify your identity
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          {isBusiness
            ? "Upload your personal KYC as the business owner, plus your business documents."
            : "Upload these documents so we can verify and approve your account."}
        </p>

        <div className="space-y-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
            Personal identity
          </p>
          <TextField label="Aadhaar number" value={aadhaarNumber} onChange={setAadhaarNumber} placeholder="12-digit Aadhaar number" required />
          <DocumentUploadField label="Aadhaar front" value={aadhaarFrontKey} onChange={setAadhaarFrontKey} upload={uploadKycFile} required />
          <DocumentUploadField label="Aadhaar back" value={aadhaarBackKey} onChange={setAadhaarBackKey} upload={uploadKycFile} required />
          <TextField label="PAN number" value={panNumber} onChange={setPanNumber} placeholder="10-character PAN" required />
          <DocumentUploadField label="PAN card photo" value={panKey} onChange={setPanKey} upload={uploadKycFile} required />
          <DocumentUploadField label="Selfie" description="A clear photo of your face, taken now" value={selfieKey} onChange={setSelfieKey} upload={uploadKycFile} required />

          {isBusiness && (
            <>
              <div className="h-px bg-stone-100 my-2" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">
                Business details
              </p>
              <TextField label="Business / company name" value={businessName} onChange={setBusinessName} required />
              <div>
                <p className="text-xs font-bold text-stone-800 mb-1.5">
                  Business type<span className="text-red-500 ml-0.5">*</span>
                </p>
                <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as BusinessEntityType)}
                    className="w-full outline-none text-sm text-stone-900 bg-transparent"
                  >
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <TextField label="GSTIN" value={gstin} onChange={setGstin} placeholder="15-character GSTIN" required />
              <TextField
                label="Business registration number"
                value={businessRegistrationNumber}
                onChange={setBusinessRegistrationNumber}
                placeholder="Incorporation / registration number"
              />
              <TextField label="Business address" value={businessAddress} onChange={setBusinessAddress} required />
              <DocumentUploadField
                label="Business / trade license"
                value={businessLicenseKey}
                onChange={setBusinessLicenseKey}
                upload={uploadKycFile}
                accept="image/*,application/pdf"
              />
              <TextField label="Business PAN number" value={businessPanNumber} onChange={setBusinessPanNumber} placeholder="Distinct from your personal PAN" />
              <DocumentUploadField
                label="Business PAN card photo"
                value={businessPanKey}
                onChange={setBusinessPanKey}
                upload={uploadKycFile}
              />
              <DocumentUploadField
                label="Cancelled cheque / bank proof"
                value={cancelledChequeKey}
                onChange={setCancelledChequeKey}
                upload={uploadKycFile}
                accept="image/*,application/pdf"
              />
            </>
          )}
        </div>

        {error && <p className="mt-4 text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="px-5 pb-8 pt-3 shrink-0 border-t border-stone-100">
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className={`w-full rounded-2xl py-4 font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            isValid && !loading
              ? "bg-stone-900 text-white hover:bg-stone-800 shadow-lg cursor-pointer"
              : "bg-stone-100 text-stone-300 cursor-not-allowed"
          }`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit for review
        </button>
      </div>
    </div>
  );
}
