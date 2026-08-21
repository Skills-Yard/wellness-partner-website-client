"use client";

import React, { useEffect, useState } from "react";
import { Globe, Landmark, MapPin, MessageCircle, Pencil, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as partnerApi from "@/lib/api/partner";
import PersonalInfoTab from "./profile/PersonalInfoTab";
import BankingDetailsTab from "./profile/BankingDetailsTab";
import LocationSettingsTab from "./profile/LocationSettingsTab";
import ProfileCompletionCard from "./profile/ProfileCompletionCard";
import type { BankAccount } from "@/lib/api/types";

type Tab = "personal" | "banking" | "location";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "personal", label: "Personal Information", icon: UserIcon },
  { id: "banking", label: "Banking Details", icon: Landmark },
  { id: "location", label: "Location Settings", icon: MapPin },
];

function BankSummaryCard({
  account,
  loaded,
  onEdit,
}: {
  account: BankAccount | null;
  loaded: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-stone-900">Banking Details</p>
            <p className="text-xs text-stone-400">Add your bank account details to receive payments.</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      {!loaded ? (
        <div className="h-20 rounded-xl bg-stone-100 animate-pulse" />
      ) : account ? (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-stone-400">Account Holder Name</p>
            <p className="text-sm font-bold text-stone-800">{account.accountHolderName}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400">Account Number</p>
            <p className="text-sm font-bold text-stone-800">{account.accountNumber}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400">IFSC Code</p>
            <p className="text-sm font-bold text-stone-800">{account.ifscCode}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400">Bank Name</p>
            <p className="text-sm font-bold text-stone-800">{account.bankName}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={onEdit}
          className="w-full text-left text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
        >
          No bank account on file yet — add one to receive payments.
        </button>
      )}
    </div>
  );
}

/**
 * Desktop-only rewrite of the Profile tab — mobile keeps the existing
 * ProfilePage (simple menu list) untouched; see PartnerHomescreen for the
 * isDesktop branch. Renders inside the dashboard's normal Sidebar/content
 * shell like Home/Money do — no back button, since Profile is a top-level
 * tab, not a drill-down subview.
 */
export default function DesktopProfilePage({ onManageAvailability }: { onManageAvailability: () => void }) {
  const { partner, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("personal");
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoaded, setBankLoaded] = useState(false);
  // A freshly-cropped photo, shown here and in PersonalInfoTab's own avatar
  // for the rest of this session — see PersonalInfoTab's note on why
  // partner.profilePhotoKey itself can't be re-displayed after a reload.
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const loadBankAccount = () => {
    partnerApi
      .getBankAccount()
      .then(setBankAccount)
      .catch(() => setBankAccount(null))
      .finally(() => setBankLoaded(true));
  };

  useEffect(() => {
    loadBankAccount();
  }, []);

  if (!partner) return null;

  const initials = (partner.name ?? "?").trim().charAt(0).toUpperCase() || "?";

  // Real completion, from actual partner/bank-account data — no fabricated
  // percentage. Service & Availability trivially reads "done" once these
  // fields carry a value, which they always do (serviceRadiusKm etc. all
  // have server-side defaults) — that's accurate, not padded: the partner
  // genuinely does have settings here, even if never touched.
  const completionItems = [
    {
      label: "Personal Information",
      done: Boolean(partner.bio && partner.yearsOfExperience != null && partner.languages.length > 0),
    },
    {
      label: "Service & Availability",
      done: Boolean(partner.serviceRadiusKm && partner.bufferMinutes != null && partner.slotDurationMinutes),
    },
    {
      label: "Location Settings",
      done: Boolean(partner.latitude != null && partner.longitude != null && partner.city),
    },
    { label: "Banking Details", done: Boolean(bankAccount) },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="w-20 h-20 rounded-full bg-stone-100 border border-stone-100 shadow-sm flex items-center justify-center text-2xl font-extrabold text-stone-400 shrink-0 overflow-hidden">
          {photoPreviewUrl ? <img src={photoPreviewUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-stone-900">{partner.name ?? "Partner"}</h1>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                partner.isOnline ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${partner.isOnline ? "bg-green-500" : "bg-stone-400"}`} />
              {partner.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            {partner.type === "BUSINESS" ? "Business Partner" : "Individual Partner"}
            {partner.yearsOfExperience != null && ` · ${partner.yearsOfExperience} Years Experience`}
          </p>
          {partner.bio && <p className="text-sm text-stone-600 mt-2 max-w-xl leading-relaxed">{partner.bio}</p>}

          <div className="flex flex-wrap items-center gap-4 mt-3">
            {(partner.city || partner.state) && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                {[partner.city, partner.state].filter(Boolean).join(", ")}
              </span>
            )}
            {partner.languages.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Globe className="h-3.5 w-3.5 text-stone-400" />
                {partner.languages.join(", ")}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <MessageCircle className="h-3.5 w-3.5 text-stone-400" />
              WhatsApp {partner.whatsappOptIn ? "Opt-in" : "Opt-out"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-stone-100">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                active ? "border-[#C9851A] text-[#C9851A]" : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
          {tab === "personal" && (
            <PersonalInfoTab
              partner={partner}
              onSaved={refreshProfile}
              onManageAvailability={onManageAvailability}
              onEditLocation={() => setTab("location")}
              photoPreviewUrl={photoPreviewUrl}
              onPhotoPreviewChange={setPhotoPreviewUrl}
            />
          )}
          {tab === "banking" && (
            <BankingDetailsTab
              onSaved={(acc) => {
                setBankAccount(acc);
              }}
            />
          )}
          {tab === "location" && <LocationSettingsTab partner={partner} onSaved={refreshProfile} />}
        </div>

        <div className="flex flex-col gap-6">
          <ProfileCompletionCard items={completionItems} />
          <BankSummaryCard account={bankAccount} loaded={bankLoaded} onEdit={() => setTab("banking")} />
        </div>
      </div>
    </div>
  );
}
