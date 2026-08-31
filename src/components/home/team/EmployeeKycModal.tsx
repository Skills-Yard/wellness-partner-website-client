"use client";

import React, { useState } from "react";
import { FileText, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DocumentUploadField from "@/components/kyc/DocumentUploadField";
import { uploadEmployeeKycFile } from "@/lib/api/upload";
import { ApiError } from "@/lib/api/client";
import { useSubmitEmployeeKyc } from "@/hooks/queries/useEmployees";

// The form body — remounted (via key) per employee by the wrapper, so state
// starts empty every open with no reset effect.
function EmployeeKycForm({
  employeeId,
  employeeName,
  onDone,
}: {
  employeeId: string;
  employeeName: string;
  onDone: (submitted?: boolean) => void;
}) {
  const submitKyc = useSubmitEmployeeKyc();

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFrontKey, setAadhaarFrontKey] = useState<string | null>(null);
  const [aadhaarBackKey, setAadhaarBackKey] = useState<string | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [panKey, setPanKey] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string | null>(null);
  const [certificateKeys, setCertificateKeys] = useState<string[]>([]);
  const [certUploading, setCertUploading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [videoKycKey, setVideoKycKey] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const upload = (file: File) => uploadEmployeeKycFile(employeeId, file);

  const handleCertPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setCertUploading(true);
    setCertError(null);
    try {
      const keys = await Promise.all(files.map((f) => upload(f)));
      setCertificateKeys((prev) => [...prev, ...keys]);
    } catch (err) {
      setCertError(err instanceof ApiError ? err.message : "Certificate upload failed.");
    } finally {
      setCertUploading(false);
    }
  };

  const coreValid = Boolean(
    aadhaarNumber.trim() && aadhaarFrontKey && aadhaarBackKey && panNumber.trim() && panKey && selfieKey
  );
  const videoValid = !videoKycKey || Number(videoDuration) > 0;
  const isValid = coreValid && videoValid;

  const handleSubmit = async () => {
    if (submitKyc.isPending) return;
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setError(null);
    try {
      await submitKyc.mutateAsync({
        id: employeeId,
        data: {
          aadhaarNumber: aadhaarNumber.trim(),
          aadhaarFrontKey: aadhaarFrontKey ?? undefined,
          aadhaarBackKey: aadhaarBackKey ?? undefined,
          panNumber: panNumber.trim().toUpperCase(),
          panKey: panKey ?? undefined,
          selfieKey: selfieKey ?? undefined,
          ...(certificateKeys.length ? { certificateKeys } : {}),
          ...(videoKycKey ? { videoKycKey, videoKycDurationSec: Number(videoDuration) } : {}),
        },
      });
      onDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit KYC.");
    }
  };

  return (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <DialogTitle className="text-base font-extrabold text-stone-900">Submit KYC</DialogTitle>
        <p className="text-xs text-stone-400 mt-0.5">For {employeeName}</p>
      </div>

      <div className="px-5 py-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
        <div>
          <p className="text-xs font-bold text-stone-800 mb-1.5">
            Aadhaar number<span className="text-red-500 ml-0.5">*</span>
          </p>
          <input
            value={aadhaarNumber}
            inputMode="numeric"
            maxLength={12}
            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
            className="w-full text-sm rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
        <DocumentUploadField label="Aadhaar front" value={aadhaarFrontKey} onChange={setAadhaarFrontKey} upload={upload} required />
        <DocumentUploadField label="Aadhaar back" value={aadhaarBackKey} onChange={setAadhaarBackKey} upload={upload} required />

        <div>
          <p className="text-xs font-bold text-stone-800 mb-1.5">
            PAN number<span className="text-red-500 ml-0.5">*</span>
          </p>
          <input
            value={panNumber}
            maxLength={10}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            className="w-full text-sm rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>
        <DocumentUploadField label="PAN card photo" value={panKey} onChange={setPanKey} upload={upload} required />
        <DocumentUploadField label="Selfie" value={selfieKey} onChange={setSelfieKey} upload={upload} required />

        <div>
          <p className="text-xs font-bold text-stone-800 mb-1.5">Certificates</p>
          {certificateKeys.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {certificateKeys.map((key, i) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/60 px-2.5 py-1.5 text-[11px] text-stone-600"
                >
                  <FileText className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="truncate flex-1">Certificate {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setCertificateKeys((prev) => prev.filter((k) => k !== key))}
                    className="p-0.5 rounded-full hover:bg-stone-200 shrink-0"
                  >
                    <X className="h-3 w-3 text-stone-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-xs text-stone-500 cursor-pointer hover:border-amber-400 transition-colors">
            <input type="file" accept=".pdf,image/*" multiple className="hidden" onChange={handleCertPick} disabled={certUploading} />
            {certUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {certUploading ? "Uploading…" : "Add certificate(s) — PDF or image"}
          </label>
          {certError && <p className="mt-1 text-[11px] text-red-500">{certError}</p>}
        </div>

        <DocumentUploadField
          label="Video KYC"
          description="Optional — a short verification clip"
          value={videoKycKey}
          onChange={(key) => {
            setVideoKycKey(key);
            if (!key) setVideoDuration("");
          }}
          upload={upload}
          accept="video/*"
        />
        {videoKycKey && (
          <div>
            <p className="text-xs font-bold text-stone-800 mb-1.5">
              Video length (seconds)<span className="text-red-500 ml-0.5">*</span>
            </p>
            <input
              value={videoDuration}
              inputMode="numeric"
              onChange={(e) => setVideoDuration(e.target.value.replace(/\D/g, ""))}
              className="w-full text-sm rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        )}

        {showErrors && !isValid && (
          <p className="text-[11px] font-medium text-red-500">
            {coreValid
              ? "Enter the video length in seconds."
              : "Fill in Aadhaar, PAN and selfie before submitting."}
          </p>
        )}
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50/60">
        <button
          onClick={() => onDone()}
          disabled={submitKyc.isPending}
          className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitKyc.isPending || certUploading}
          className="flex-1 rounded-xl bg-stone-900 text-white py-2.5 text-sm font-bold hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitKyc.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit KYC
        </button>
      </div>
    </>
  );
}

/**
 * Submit / re-submit an employee's KYC — POST /partner/employees/:id/kyc.
 * File fields presign + upload through /partner/employees/:id/kyc/upload-url
 * (see uploadEmployeeKycFile) and the returned r2 keys go in the body.
 * Aadhaar + PAN + selfie are required; certificates and the video are
 * optional, and the video's duration is only sent when a video is attached.
 */
export default function EmployeeKycModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSubmitted: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-0 overflow-hidden">
        <EmployeeKycForm
          key={employeeId}
          employeeId={employeeId}
          employeeName={employeeName}
          onDone={(submitted) => {
            if (submitted) onSubmitted();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
