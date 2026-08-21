"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import KycForm from "./KycForm";
import DesktopKycForm from "../loginOnboarding/desktop/DesktopKycForm";
import { useIsDesktopViewport } from "@/lib/hooks/useIsDesktopViewport";
import { useAuth } from "@/lib/auth/AuthProvider";
import * as kycApi from "@/lib/api/kyc";
import { ApiError } from "@/lib/api/client";
import type { PartnerKyc } from "@/lib/api/types";

export default function KycFlow() {
  const { partner, refreshProfile, logout } = useAuth();
  const isDesktop = useIsDesktopViewport();
  const [kyc, setKyc] = useState<PartnerKyc | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    kycApi
      .getKyc()
      .then(setKyc)
      .catch((err) => {
        // NOT_FOUND is expected for a partner who's never submitted KYC before
        if (err instanceof ApiError && err.status === 404) setKyc(null);
        else setKyc(null);
      });
  }, []);

  if (!partner || kyc === undefined || isDesktop === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  const isResubmission = kyc?.status === "RESUBMISSION_REQUIRED";

  if (isDesktop) {
    return (
      <div className="w-full">
        {isResubmission && (
          <div className="max-w-4xl mx-auto mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Resubmission needed</p>
              {kyc?.adminNotes && <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{kyc.adminNotes}</p>}
            </div>
          </div>
        )}
        <DesktopKycForm partnerType={partner.type} initial={kyc ?? null} onSubmitted={() => refreshProfile()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-4 pt-5 pb-1 flex items-center justify-between shrink-0">
        <div className="w-8" />
        <button
          onClick={() => logout()}
          className="text-[11px] font-semibold text-stone-400 hover:text-stone-600 flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Sign out
        </button>
      </div>

      {isResubmission && (
        <div className="mx-5 mb-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2.5 shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Resubmission needed</p>
            {kyc?.adminNotes && (
              <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{kyc.adminNotes}</p>
            )}
          </div>
        </div>
      )}

      <KycForm
        partnerType={partner.type}
        initial={kyc ?? null}
        onSubmitted={() => refreshProfile()}
      />
    </div>
  );
}
