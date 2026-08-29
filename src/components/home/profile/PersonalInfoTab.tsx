"use client";

import React, { useRef, useState } from "react";
import {
  Camera,
  ExternalLink,
  Layers,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Ruler,
  Timer,
  User,
  Wifi,
  X,
} from "lucide-react";
import * as partnerApi from "@/lib/api/partner";
import { uploadKycFile } from "@/lib/api/upload";
import { cdnUrl } from "@/lib/api/cdn";
import { ApiError } from "@/lib/api/client";
import ToggleSwitch from "./ToggleSwitch";
import ImageCropModal from "./ImageCropModal";
import PartnerAvatar from "../PartnerAvatar";
import type { Partner } from "@/lib/api/types";

/** Free-form tag input for languages — there's no fixed language list in
 *  the data model, just a string[], so this is a plain type-and-add field
 *  rather than a dropdown. */
function LanguagesInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (langs: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addLanguage = () => {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((lang) => (
            <span
              key={lang}
              className="flex items-center gap-1.5 rounded-full bg-[#FFF8EC] border border-[#F0DDBF] px-2.5 py-1 text-xs font-bold text-[#C9851A]"
            >
              {lang}
              <button
                onClick={() => onChange(value.filter((l) => l !== lang))}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addLanguage();
            }
          }}
          placeholder="Type a language, press Enter"
          className="flex-1 rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
        />
        <button
          type="button"
          onClick={addLanguage}
          className="px-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
  editing,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  editing?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-stone-900">{title}</p>
          <p className="text-xs text-stone-400">{subtitle}</p>
        </div>
      </div>
      {onEdit && !editing && (
        <button
          onClick={onEdit}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      )}
    </div>
  );
}

function CardSaveFooter({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-stone-100">
      <button
        onClick={onCancel}
        disabled={saving}
        className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#C9851A] text-white px-4 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60"
      >
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}

function PersonalInformationCard({
  partner,
  onSaved,
  photoPreviewUrl,
  onPhotoPreviewChange,
}: {
  partner: Partner;
  onSaved: () => Promise<void>;
  photoPreviewUrl: string | null;
  onPhotoPreviewChange: (url: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(partner.name ?? "");
  const [email, setEmail] = useState(partner.email ?? "");
  const [bio, setBio] = useState(partner.bio ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    partner.yearsOfExperience?.toString() ?? "",
  );
  const [languages, setLanguages] = useState<string[]>(partner.languages ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setName(partner.name ?? "");
    setEmail(partner.email ?? "");
    setBio(partner.bio ?? "");
    setYearsOfExperience(partner.yearsOfExperience?.toString() ?? "");
    setLanguages(partner.languages ?? []);
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedBio = bio.trim();
      const yearsValue = yearsOfExperience.trim() ? Number(yearsOfExperience) : undefined;

      // Only send whichever fields actually changed — PATCH /partner/profile
      // writes every key it's given, so unconditionally resending the whole
      // form risks clobbering a field the partner never touched this time
      // (e.g. blanking email back to "" just because the input started
      // empty) even though nothing about it was actually edited.
      const updates: Parameters<typeof partnerApi.updateProfile>[0] = {};
      if (trimmedName !== (partner.name ?? "")) updates.name = trimmedName;
      if (trimmedEmail !== (partner.email ?? "")) updates.email = trimmedEmail;
      if (trimmedBio !== (partner.bio ?? "")) updates.bio = trimmedBio;
      if (yearsValue !== (partner.yearsOfExperience ?? undefined)) updates.yearsOfExperience = yearsValue;
      if (JSON.stringify(languages) !== JSON.stringify(partner.languages)) updates.languages = languages;

      if (Object.keys(updates).length > 0) {
        await partnerApi.updateProfile(updates);
      }
      await onSaved();
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save your details. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // File picked -> crop modal first, upload only happens once the partner
  // confirms a crop (see handleCropConfirm) — nothing hits the network
  // just from selecting a file.
  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reuses the KYC document upload endpoint — there's no dedicated profile-
  // photo upload endpoint anywhere in this app yet, so the resulting file
  // ends up under a "kyc/" key prefix for what's actually a public profile
  // photo. Known, deliberate trade-off until a real endpoint exists.
  //
  // Despite the name, profilePhotoKey is saved (below) as the full CDN URL
  // (cdnUrl(r2Key)), not a raw storage key — so it's directly browsable and
  // PartnerAvatar can render it straight from `partner` after a refetch.
  //
  // The r2Key is deterministic (kyc/<partnerId>/images/profile-photo_v1.jpg
  // every time) and R2 stores it `immutable, max-age=31536000`, so a
  // re-upload overwrites the object but the edge/browser keep serving the
  // old one — `bust: true` appends a ?v=<ts> so each save is a fresh URL.
  // That also means the stored string changes on every upload, so avatar
  // consumers actually re-render after onSaved().
  //
  // photoPreviewUrl covers only the gap before that refetch lands: it shows
  // the locally-cropped file immediately (lifted to DesktopProfilePage so
  // the page header shows it too) instead of waiting on the round trip.
  const handleCropConfirm = async (blob: Blob, previewUrl: string) => {
    setCropFile(null);
    setUploadingPhoto(true);
    setError(null);
    try {
      const croppedFile = new File([blob], "profile-photo.jpg", {
        type: "image/jpeg",
      });
      const r2Key = await uploadKycFile(croppedFile);
      const profilePhotoUrl = cdnUrl(r2Key, { bust: true });
      if (!profilePhotoUrl) {
        throw new Error(
          "Image CDN is not configured — set NEXT_PUBLIC_CLOUDFLARE_CDN_DOMAIN.",
        );
      }
      await partnerApi.updateProfile({
        profilePhotoKey: profilePhotoUrl,
      });
      onPhotoPreviewChange(previewUrl);
      await onSaved();
    } catch (err) {
      // ApiError extends Error, so this also covers upload/PATCH failures.
      setError(
        err instanceof Error
          ? err.message
          : "Could not upload photo. Please try again.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6">
      <CardHeader
        icon={<User className="h-5 w-5" />}
        title="Personal Information"
        subtitle="Update your personal details and professional information."
        editing={editing}
        onEdit={startEdit}
      />

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">
            Profile Photo
          </p>
          <div className="relative w-20 h-20">
            <PartnerAvatar
              partner={partner}
              photoUrl={photoPreviewUrl}
              className="w-20 h-20 bg-stone-100 text-xl text-stone-400"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C9851A] text-white flex items-center justify-center shadow-md hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoPick}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-2">JPG, PNG up to 2MB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">Full Name</p>
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            ) : (
              <p className="text-sm font-semibold text-stone-900">
                {partner.name ?? "—"}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">
              Email Address
            </p>
            {editing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            ) : (
              <p className="text-sm font-semibold text-stone-900">
                {partner.email ?? "—"}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-stone-700 mb-1.5">Bio</p>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
              />
            ) : (
              <p className="text-sm text-stone-600 leading-relaxed">
                {partner.bio || "No bio added yet."}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">
              Years of Experience
            </p>
            {editing ? (
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
            ) : (
              <p className="text-sm font-semibold text-stone-900">
                {partner.yearsOfExperience != null
                  ? `${partner.yearsOfExperience} Years`
                  : "—"}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">
              Languages Spoken
            </p>
            {editing ? (
              <LanguagesInput value={languages} onChange={setLanguages} />
            ) : (
              <p className="text-sm font-semibold text-stone-900">
                {partner.languages.length > 0
                  ? partner.languages.join(", ")
                  : "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
      )}
      {editing && (
        <CardSaveFooter
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      )}

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onCropped={handleCropConfirm}
        />
      )}
    </div>
  );
}

function ServiceAvailabilityCard({
  partner,
  onSaved,
  onManageAvailability,
}: {
  partner: Partner;
  onSaved: () => Promise<void>;
  onManageAvailability: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    String(partner.serviceRadiusKm),
  );
  const [bufferMinutes, setBufferMinutes] = useState(
    String(partner.bufferMinutes),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingWhatsapp, setTogglingWhatsapp] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const startEdit = () => {
    setServiceRadiusKm(String(partner.serviceRadiusKm));
    setBufferMinutes(String(partner.bufferMinutes));
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const radiusValue = Number(serviceRadiusKm);
      const bufferValue = Number(bufferMinutes);

      // Same "only send what changed" reasoning as PersonalInformationCard.
      const updates: Parameters<typeof partnerApi.updateProfile>[0] = {};
      if (radiusValue !== partner.serviceRadiusKm) updates.serviceRadiusKm = radiusValue;
      if (bufferValue !== partner.bufferMinutes) updates.bufferMinutes = bufferValue;

      if (Object.keys(updates).length > 0) {
        await partnerApi.updateProfile(updates);
      }
      await onSaved();
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp/Online both save immediately — see ToggleSwitch. isOnline is
  // deliberately a distinct control from the day-wise weekly schedule in
  // Availability & slots: this is a single master "open for business right
  // now" switch, that's a per-day window — different states, not a second
  // control for the same one.
  const toggleWhatsapp = async () => {
    setTogglingWhatsapp(true);
    try {
      await partnerApi.updateProfile({ whatsappOptIn: !partner.whatsappOptIn });
      await onSaved();
    } catch {
      // best-effort — partner can just try again
    } finally {
      setTogglingWhatsapp(false);
    }
  };

  const toggleOnline = async () => {
    setTogglingOnline(true);
    try {
      await partnerApi.updateProfile({ isOnline: !partner.isOnline });
      await onSaved();
    } catch {
      // best-effort
    } finally {
      setTogglingOnline(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6">
      <CardHeader
        icon={<Ruler className="h-5 w-5" />}
        title="Service & Availability Settings"
        subtitle="Set your service area, availability and preferences."
        editing={editing}
        onEdit={startEdit}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5 text-stone-400" /> Service Radius
          </p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              <span className="text-xs text-stone-400 shrink-0">km</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-stone-900">
              {partner.serviceRadiusKm} km
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-stone-400" /> Buffer Time
          </p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              <span className="text-xs text-stone-400 shrink-0">min</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-stone-900">
              {partner.bufferMinutes} minutes
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-stone-400" /> Slot Duration
          </p>
          <p className="text-sm font-semibold text-stone-900">
            {partner.slotDurationMinutes} minutes
          </p>
          <button
            onClick={onManageAvailability}
            className="text-[11px] font-bold text-[#C9851A] hover:underline cursor-pointer mt-0.5"
          >
            Manage in Availability & slots
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-xs font-medium text-red-500">{error}</p>
      )}
      {editing && (
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#C9851A] text-white px-4 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-[#FAF9F6] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800">
                WhatsApp Updates
              </p>
              <p className="text-xs text-stone-400">
                Receive booking and updates on WhatsApp
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={partner.whatsappOptIn}
            onChange={toggleWhatsapp}
            loading={togglingWhatsapp}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-[#FAF9F6] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Wifi className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-stone-800">Online Status</p>
              <p className="text-xs text-stone-400">
                Show your availability to clients
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={partner.isOnline}
            onChange={toggleOnline}
            loading={togglingOnline}
          />
        </div>
      </div>
    </div>
  );
}

function LocationSummaryCard({
  partner,
  onEditLocation,
}: {
  partner: Partner;
  onEditLocation: () => void;
}) {
  const mapsUrl =
    partner.latitude != null && partner.longitude != null
      ? `https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`
      : null;

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5 sm:p-6">
      <CardHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Location"
        subtitle="Your current working location."
        onEdit={onEditLocation}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-100 bg-[#FAF9F6] px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-[#C9851A]">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-800 truncate">
              {[partner.city, partner.state].filter(Boolean).join(", ") ||
                "Not set yet"}
            </p>
            {partner.latitude != null && partner.longitude != null && (
              <p className="text-xs text-stone-400">
                {partner.latitude.toFixed(4)}, {partner.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View on Map
          </a>
        )}
      </div>
    </div>
  );
}

export default function PersonalInfoTab({
  partner,
  onSaved,
  onManageAvailability,
  onEditLocation,
  photoPreviewUrl,
  onPhotoPreviewChange,
}: {
  partner: Partner;
  onSaved: () => Promise<void>;
  onManageAvailability: () => void;
  onEditLocation: () => void;
  // Lifted to DesktopProfilePage so the page header's avatar (a separate
  // component instance) shows the same freshly-cropped photo instantly,
  // not just this card — see that file's own note on why the underlying
  // key can't just be re-displayed after a refetch.
  photoPreviewUrl: string | null;
  onPhotoPreviewChange: (url: string | null) => void;
}) {
  return (
    <div className="space-y-5">
      <PersonalInformationCard
        partner={partner}
        onSaved={onSaved}
        photoPreviewUrl={photoPreviewUrl}
        onPhotoPreviewChange={onPhotoPreviewChange}
      />
      <ServiceAvailabilityCard
        partner={partner}
        onSaved={onSaved}
        onManageAvailability={onManageAvailability}
      />
      <LocationSummaryCard partner={partner} onEditLocation={onEditLocation} />
    </div>
  );
}
