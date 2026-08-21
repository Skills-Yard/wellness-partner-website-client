"use client";

import React, { useRef, useState } from "react";
import { CheckCircle2, CreditCard, FileText, IdCard, Loader2, User, UploadCloud, Video, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";

export type DocumentKind = "aadhaar" | "pan" | "selfie" | "pdf" | "video";

const KIND_STYLE: Record<Exclude<DocumentKind, "selfie">, { bg: string; text: string }> = {
  aadhaar: { bg: "bg-[#FDF3E7]", text: "text-[#C9851A]" },
  pan: { bg: "bg-blue-50", text: "text-blue-500" },
  pdf: { bg: "bg-red-50", text: "text-red-500" },
  video: { bg: "bg-purple-50", text: "text-purple-500" },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toUpperCase();
}

/** The uploaded/selected state — a colored icon (or a real thumbnail for a
 *  freshly-picked image, via an object URL) + filename + type/size, with a
 *  resting green checkmark that swaps to a remove button on hover when
 *  onRemove is given (certificates only — the single-value fields replace
 *  in place instead of removing). */
export function DocumentRow({
  icon,
  kind,
  thumbnailUrl,
  title,
  subtitle,
  onClick,
  onRemove,
}: {
  icon: React.ReactNode;
  kind: DocumentKind;
  thumbnailUrl?: string | null;
  title: string;
  subtitle: string;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const style = kind === "selfie" ? { bg: "bg-stone-100", text: "text-stone-500" } : KIND_STYLE[kind];
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border border-stone-100 bg-[#FAF9F6] px-3 py-2.5 transition-colors ${
        onClick ? "cursor-pointer hover:border-stone-200" : ""
      }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${style.bg} ${style.text}`}>
        {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-stone-800 truncate">{title}</p>
        <p className="text-[11px] text-stone-500 truncate">{subtitle}</p>
      </div>
      <div className="relative w-5 h-5 shrink-0">
        <CheckCircle2 className={`h-5 w-5 text-green-500 absolute inset-0 transition-opacity ${onRemove ? "group-hover:opacity-0" : ""}`} />
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Remove"
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

interface DesktopDocumentFieldProps {
  label: string;
  description?: string;
  kind: DocumentKind;
  value: string | null;
  onChange: (r2Key: string | null) => void;
  upload: (file: File) => Promise<string>;
  accept?: string;
  required?: boolean;
}

/** Single-value document upload, restyled to match the icon/thumbnail +
 *  filename + type/size row design — same upload mechanics as
 *  DocumentUploadField (mobile's version, left untouched), just a
 *  different resting/uploaded appearance for the desktop wizard.
 *
 *  File name/size/type only exist in the browser for the file just picked
 *  this session — a KYC resumed from the server only has the r2Key, so
 *  that case falls back to the key's filename with no size shown, and no
 *  real image thumbnail (nothing local to read one from). */
export default function DesktopDocumentField({
  label,
  description,
  kind,
  value,
  onChange,
  upload,
  accept = "image/*",
  required,
}: DesktopDocumentFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const r2Key = await upload(file);
      setPickedFile(file);
      if (kind === "selfie" || kind === "aadhaar" || kind === "pan") {
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        setThumbnailUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
      }
      onChange(r2Key);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = () => {
    onChange(null);
    setPickedFile(null);
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    setThumbnailUrl(null);
  };

  return (
    <div>
      <p className="text-xs font-bold text-stone-800 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {description && <p className="text-[11px] text-stone-400 mb-1.5">{description}</p>}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handlePick} disabled={uploading} id={`doc-${label}`} />

      {uploading ? (
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-[#F9F6F0] px-4 py-3.5">
          <Loader2 className="h-4 w-4 text-stone-500 animate-spin shrink-0" />
          <span className="text-sm text-stone-600">Uploading…</span>
        </div>
      ) : value ? (
        <DocumentRow
          icon={kindIcon(kind)}
          kind={kind}
          thumbnailUrl={thumbnailUrl}
          title={label}
          subtitle={pickedFile ? `${fileExtension(pickedFile.name)} • ${formatFileSize(pickedFile.size)}` : "Uploaded"}
          onClick={() => inputRef.current?.click()}
          onRemove={clear}
        />
      ) : (
        <label
          htmlFor={`doc-${label}`}
          className="flex items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-[#F9F6F0] hover:border-amber-400 px-4 py-3.5 cursor-pointer transition-all"
        >
          <UploadCloud className="h-4 w-4 text-stone-400 shrink-0" />
          <span className="text-sm text-stone-700">Tap to upload</span>
        </label>
      )}

      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function kindIcon(kind: DocumentKind) {
  switch (kind) {
    case "aadhaar":
      return <IdCard className="h-5 w-5" />;
    case "pan":
      return <CreditCard className="h-5 w-5" />;
    case "selfie":
      return <User className="h-5 w-5" />;
    case "pdf":
      return <FileText className="h-5 w-5" />;
    case "video":
      return <Video className="h-5 w-5" />;
  }
}
