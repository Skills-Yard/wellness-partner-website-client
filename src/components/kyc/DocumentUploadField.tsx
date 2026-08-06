"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";

interface DocumentUploadFieldProps {
  label: string;
  description?: string;
  value: string | null;
  onChange: (r2Key: string | null) => void;
  upload: (file: File) => Promise<string>;
  accept?: string;
  required?: boolean;
}

export default function DocumentUploadField({
  label,
  description,
  value,
  onChange,
  upload,
  accept = "image/*",
  required,
}: DocumentUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const r2Key = await upload(file);
      setFileName(file.name);
      onChange(r2Key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <p className="text-xs font-bold text-stone-800 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {description && <p className="text-[11px] text-stone-400 mb-1.5">{description}</p>}

      <label
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition-all ${
          value
            ? "border-green-300 bg-green-50/60"
            : "border-stone-200 bg-[#F9F6F0] hover:border-amber-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handlePick}
          disabled={uploading}
        />
        {uploading ? (
          <Loader2 className="h-4 w-4 text-stone-500 animate-spin shrink-0" />
        ) : value ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        ) : (
          <UploadCloud className="h-4 w-4 text-stone-400 shrink-0" />
        )}
        <span className="text-sm text-stone-700 truncate flex-1">
          {uploading ? "Uploading…" : value ? fileName ?? "Document uploaded" : "Tap to upload"}
        </span>
        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
              setFileName(null);
            }}
            className="p-1 rounded-full hover:bg-stone-200 shrink-0"
          >
            <X className="h-3.5 w-3.5 text-stone-500" />
          </button>
        )}
      </label>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
