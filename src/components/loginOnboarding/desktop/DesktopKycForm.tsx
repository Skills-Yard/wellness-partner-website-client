"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Lock, UploadCloud, Video } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { uploadKycFile } from "@/lib/api/upload";
import * as kycApi from "@/lib/api/kyc";
import { ApiError } from "@/lib/api/client";
import DesktopDocumentField, { DocumentRow } from "./DesktopDocumentField";
import { DesktopStepCard, DesktopPrimaryButton, DesktopSecondaryButton } from "./DesktopFormKit";
import { useOnboardingWizardStep } from "../OnboardingWizardContext";
import type { BusinessEntityType, PartnerKyc, PartnerType } from "@/lib/api/types";

const BUSINESS_TYPES: { value: BusinessEntityType; label: string }[] = [
  { value: "PROPRIETORSHIP", label: "Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PRIVATE_LIMITED", label: "Private Limited" },
  { value: "LLP", label: "LLP" },
  { value: "OTHER", label: "Other" },
];

const MAX_CERTIFICATES = 5;

/** The "your information is safe with us" trust badge in the Verify
 *  Identity header — this is the one KYC-specific reassurance, not a
 *  generic DesktopStepCard feature, so it lives here rather than in the
 *  shared form kit. */
function SecurityBadge() {
  return (
    <div className="hidden lg:flex items-start gap-3 rounded-2xl border border-[#F5E3C6] bg-[#FFF8EC] px-4 py-3 max-w-xs shrink-0">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
        <Lock className="h-4 w-4 text-[#C9851A]" />
      </div>
      <div>
        <p className="text-xs font-bold text-stone-900">Your information is safe with us</p>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">We use industry standard security to protect your data.</p>
      </div>
    </div>
  );
}

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

function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toUpperCase();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Certificates are the one KYC document that's a list rather than a single
 *  file — DesktopDocumentField only holds one value, so this manages its
 *  own small array, reusing the same DocumentRow presentation. */
function CertificatesField({
  keys,
  files,
  onAdd,
  onRemove,
}: {
  keys: string[];
  files: Record<string, File>;
  onAdd: (key: string, file: File) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const key = await uploadKycFile(file);
      onAdd(key, file);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-stone-800 mb-1.5">Certificates (Max {MAX_CERTIFICATES})</p>
      <div className="space-y-2">
        {keys.map((key, i) => {
          const file = files[key];
          return (
            <DocumentRow
              key={key}
              kind="pdf"
              icon={<FileText className="h-5 w-5" />}
              title={file?.name ?? key.split("/").pop() ?? "Certificate"}
              subtitle={file ? `${fileExtension(file.name)} • ${formatFileSize(file.size)}` : "Uploaded"}
              onRemove={() => onRemove(i)}
            />
          );
        })}
        {keys.length < MAX_CERTIFICATES && (
          <label
            className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition-all ${
              uploading ? "opacity-60 border-stone-200 bg-[#F9F6F0]" : "border-stone-200 bg-[#F9F6F0] hover:border-amber-400"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handlePick}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-4 w-4 text-stone-500 animate-spin shrink-0" />
            ) : (
              <UploadCloud className="h-4 w-4 text-stone-400 shrink-0" />
            )}
            <span className="text-sm text-stone-600">{uploading ? "Uploading…" : "Add Another Certificate"}</span>
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/** Same upload flow as DesktopDocumentField, plus reading the clip's real
 *  duration client-side (a throwaway <video> + object URL) before
 *  uploading, so videoKycDurationSec reflects the actual recording. */
function VideoKycField({
  value,
  file,
  durationSec,
  onChange,
}: {
  value: string | null;
  file: File | null;
  durationSec: number | null;
  onChange: (key: string | null, file: File | null, duration: number | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readDuration = (f: File) =>
    new Promise<number | null>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(f);
    });

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setUploading(true);
    setError(null);
    try {
      const duration = await readDuration(picked);
      const key = await uploadKycFile(picked);
      onChange(key, picked, duration);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-stone-800 mb-1.5">Video KYC</p>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handlePick} disabled={uploading} id="video-kyc-input" />
      {uploading ? (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-[#F9F6F0] px-4 py-3.5">
          <Loader2 className="h-4 w-4 text-stone-500 animate-spin shrink-0" />
          <span className="text-sm text-stone-600">Uploading…</span>
        </div>
      ) : value ? (
        <DocumentRow
          kind="video"
          icon={<Video className="h-5 w-5" />}
          title={file?.name ?? "Video KYC"}
          subtitle={`${file ? `${fileExtension(file.name)} • ` : ""}${durationSec ?? "—"} sec`}
          onClick={() => inputRef.current?.click()}
          onRemove={() => onChange(null, null, null)}
        />
      ) : (
        <label
          htmlFor="video-kyc-input"
          className="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-[#F9F6F0] hover:border-amber-400 px-4 py-3.5 cursor-pointer transition-all"
        >
          <UploadCloud className="h-4 w-4 text-stone-400 shrink-0" />
          <span className="text-sm text-stone-700">Upload a short verification video</span>
        </label>
      )}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-stone-500">{label}</span>
      <span className="text-xs font-bold text-stone-800 text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4">
      <p className="text-xs font-extrabold uppercase tracking-wide text-stone-400 mb-2">{title}</p>
      {children}
    </div>
  );
}

interface DesktopKycFormProps {
  partnerType: PartnerType;
  initial: PartnerKyc | null;
  onSubmitted: () => void;
}

export default function DesktopKycForm({ partnerType, initial, onSubmitted }: DesktopKycFormProps) {
  const { partner } = useAuth();
  const { setActiveStep } = useOnboardingWizardStep();
  const [phase, setPhase] = useState<"form" | "review">("form");

  // Both phases (filling in documents, then reviewing them) live under the
  // single "Review & Submit" sidebar step — "Verify Identity" is reserved
  // for what happens after submitting, see OnboardingWizardContext.
  useEffect(() => setActiveStep("review"), [setActiveStep]);

  const [aadhaarNumber, setAadhaarNumber] = useState(initial?.aadhaarNumber ?? "");
  const [aadhaarFrontKey, setAadhaarFrontKey] = useState<string | null>(initial?.aadhaarFrontKey ?? null);
  const [aadhaarBackKey, setAadhaarBackKey] = useState<string | null>(initial?.aadhaarBackKey ?? null);
  const [panNumber, setPanNumber] = useState(initial?.panNumber ?? "");
  const [panKey, setPanKey] = useState<string | null>(initial?.panKey ?? null);
  const [selfieKey, setSelfieKey] = useState<string | null>(initial?.selfieKey ?? null);
  const [certificateKeys, setCertificateKeys] = useState<string[]>(initial?.certificateKeys ?? []);
  const [certificateFiles, setCertificateFiles] = useState<Record<string, File>>({});
  const [videoKycKey, setVideoKycKey] = useState<string | null>(initial?.videoKycKey ?? null);
  const [videoKycFile, setVideoKycFile] = useState<File | null>(null);
  const [videoKycDurationSec, setVideoKycDurationSec] = useState<number | null>(initial?.videoKycDurationSec ?? null);

  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [businessType, setBusinessType] = useState<BusinessEntityType | "">(initial?.businessType ?? "");
  const [gstin, setGstin] = useState(initial?.gstin ?? "");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(initial?.businessRegistrationNumber ?? "");
  const [businessAddress, setBusinessAddress] = useState(initial?.businessAddress ?? "");
  const [businessLicenseKey, setBusinessLicenseKey] = useState<string | null>(initial?.businessLicenseKey ?? null);
  const [businessPanNumber, setBusinessPanNumber] = useState(initial?.businessPanNumber ?? "");
  const [businessPanKey, setBusinessPanKey] = useState<string | null>(initial?.businessPanKey ?? null);
  const [cancelledChequeKey, setCancelledChequeKey] = useState<string | null>(initial?.cancelledChequeKey ?? null);

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
      (!isBusiness || (businessName.trim() && businessType && gstin.trim() && businessAddress.trim()))
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
        certificateKeys,
        videoKycKey: videoKycKey ?? undefined,
        videoKycDurationSec: videoKycDurationSec ?? undefined,
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

  if (phase === "review") {
    const personalDocsCount = [aadhaarFrontKey, aadhaarBackKey, panKey, selfieKey].filter(Boolean).length;
    const businessDocsCount = [businessLicenseKey, businessPanKey, cancelledChequeKey].filter(Boolean).length;
    const services = (partner?.partnerServices ?? []).map((s) => s.serviceItem.cardTitle);

    return (
      <DesktopStepCard
        title="Review your details"
        subtitle="Please review all information before submitting"
        align="left"
        headerOutsideCard
        error={error}
      >
        <div className={`grid gap-4 ${isBusiness ? "grid-cols-3" : "grid-cols-2"}`}>
          <ReviewCard title="Work & Location">
            <ReviewRow label="Location" value={partner?.city ?? "—"} />
          </ReviewCard>

          <ReviewCard title="Partner Details">
            <ReviewRow label="Full Name" value={partner?.name ?? "—"} />
            <ReviewRow label="Service Type" value={services.length ? services.join(", ") : "—"} />
          </ReviewCard>

          <ReviewCard title="Verification Documents">
            <ReviewRow label="Personal Documents" value={`${personalDocsCount}/4 Uploaded`} />
            <ReviewRow label="Certificates" value={`${certificateKeys.length} Uploaded`} />
            {isBusiness && <ReviewRow label="Business Documents" value={`${businessDocsCount}/3 Uploaded`} />}
            <ReviewRow label="Video KYC" value={videoKycKey ? `${videoKycDurationSec ?? "—"} sec` : "Not added"} />
          </ReviewCard>
        </div>

        <div className="mt-8 flex items-center justify-between gap-6">
          <DesktopSecondaryButton onClick={() => setPhase("form")}>Back</DesktopSecondaryButton>
          <div className="flex-1 max-w-md">
            <DesktopPrimaryButton onClick={handleSubmit} loading={loading}>
              Submit for Verification
            </DesktopPrimaryButton>
          </div>
        </div>
      </DesktopStepCard>
    );
  }

  return (
    <DesktopStepCard
      title="Verify your identity"
      subtitle="Please provide the following details and documents to verify your identity."
      align="left"
      headerOutsideCard
      headerRight={<SecurityBadge />}
      error={error}
    >
      <div className={`grid gap-8 ${isBusiness ? "grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
        <div className="space-y-4">
          <p className="text-sm font-bold text-stone-900">Personal Details</p>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Aadhaar Number" value={aadhaarNumber} onChange={setAadhaarNumber} placeholder="12-digit Aadhaar number" />
            <TextField label="PAN Number" value={panNumber} onChange={setPanNumber} placeholder="10-character PAN" />
          </div>

          <p className="text-sm font-bold text-stone-900 pt-2">Upload Documents</p>
          <DesktopDocumentField label="Aadhaar Card (Front)" kind="aadhaar" value={aadhaarFrontKey} onChange={setAadhaarFrontKey} upload={uploadKycFile} />
          <DesktopDocumentField label="Aadhaar Card (Back)" kind="aadhaar" value={aadhaarBackKey} onChange={setAadhaarBackKey} upload={uploadKycFile} />
          <DesktopDocumentField label="PAN Card" kind="pan" value={panKey} onChange={setPanKey} upload={uploadKycFile} />
          <DesktopDocumentField label="Selfie" description="A clear photo of your face, taken now" kind="selfie" value={selfieKey} onChange={setSelfieKey} upload={uploadKycFile} />
          <CertificatesField
            keys={certificateKeys}
            files={certificateFiles}
            onAdd={(key, file) => {
              setCertificateKeys((prev) => [...prev, key]);
              setCertificateFiles((prev) => ({ ...prev, [key]: file }));
            }}
            onRemove={(index) => setCertificateKeys((prev) => prev.filter((_, i) => i !== index))}
          />
          <VideoKycField
            value={videoKycKey}
            file={videoKycFile}
            durationSec={videoKycDurationSec}
            onChange={(key, file, duration) => {
              setVideoKycKey(key);
              setVideoKycFile(file);
              setVideoKycDurationSec(duration);
            }}
          />
        </div>

        {isBusiness && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-stone-900">Business Details</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Business Name" value={businessName} onChange={setBusinessName} />
              <div>
                <p className="text-xs font-bold text-stone-800 mb-1.5">Business Type</p>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="GSTIN" value={gstin} onChange={setGstin} placeholder="15-character GSTIN" />
              <TextField
                label="Business Registration Number"
                value={businessRegistrationNumber}
                onChange={setBusinessRegistrationNumber}
                placeholder="Incorporation / registration number"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-800 mb-1.5">Business Address</p>
              <div className="rounded-xl border border-stone-200 bg-[#F9F6F0] px-4 py-3 focus-within:bg-white focus-within:border-amber-500 transition-all">
                <textarea
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  rows={2}
                  className="w-full outline-none text-sm text-stone-900 bg-transparent placeholder:text-stone-400 resize-none"
                />
              </div>
            </div>

            <p className="text-sm font-bold text-stone-900 pt-2">Business Documents</p>
            <DesktopDocumentField label="Business License" kind="pdf" value={businessLicenseKey} onChange={setBusinessLicenseKey} upload={uploadKycFile} accept="image/*,application/pdf" />
            <TextField label="Business PAN Number" value={businessPanNumber} onChange={setBusinessPanNumber} placeholder="Distinct from your personal PAN" />
            <DesktopDocumentField label="Business PAN" kind="pan" value={businessPanKey} onChange={setBusinessPanKey} upload={uploadKycFile} />
            <DesktopDocumentField label="Cancelled Cheque" kind="pan" value={cancelledChequeKey} onChange={setCancelledChequeKey} upload={uploadKycFile} accept="image/*,application/pdf" />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <DesktopPrimaryButton onClick={() => setPhase("review")} disabled={!isValid} full={false}>
          Continue to Review
        </DesktopPrimaryButton>
        <p className="text-[11px] text-stone-400">You can review all details before submitting</p>
      </div>
    </DesktopStepCard>
  );
}
