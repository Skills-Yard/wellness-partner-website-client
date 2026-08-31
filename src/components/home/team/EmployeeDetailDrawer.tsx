"use client";

import React from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Pencil,
  Phone,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { useEmployeeKyc } from "@/hooks/queries/useEmployees";
import type { PartnerEmployee, PartnerKyc } from "@/lib/api/types";
import PartnerAvatar from "../PartnerAvatar";
import { EMPLOYEE_STATUS_STYLE } from "./constants";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function maskAadhaar(value?: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `•••• •••• ${digits.slice(-4)}` : value;
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#FDF3E7] flex items-center justify-center shrink-0 text-[#C9851A]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-400">{label}</p>
        <p className="text-sm font-semibold text-stone-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function DocCheck({ label, present }: { label: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-stone-500">{label}</span>
      {present ? (
        <span className="flex items-center gap-1 font-semibold text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
        </span>
      ) : (
        <span className="text-stone-300">—</span>
      )}
    </div>
  );
}

function KycSection({
  kyc,
  onSubmit,
}: {
  kyc: ReturnType<typeof useEmployeeKyc>;
  onSubmit: () => void;
}) {
  if (kyc.isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking KYC…
      </div>
    );
  }

  const record = kyc.data as PartnerKyc | undefined;

  if (!record) {
    // 404 / no record — the endpoint 404s until something is submitted.
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-3.5">
        <p className="text-xs text-stone-500 mb-2.5">
          {kyc.isError ? "No KYC submitted for this team member yet." : "KYC details are unavailable right now."}
        </p>
        <button
          onClick={onSubmit}
          className="w-full rounded-xl bg-stone-900 text-white py-2.5 text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Submit KYC
        </button>
      </div>
    );
  }

  const needsResubmit = record.status === "REJECTED" || record.status === "RESUBMISSION_REQUIRED";

  return (
    <div className="rounded-xl border border-stone-100 bg-[#FAF9F6] p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-stone-500">Status</span>
        <span className={`font-bold ${needsResubmit ? "text-red-600" : "text-stone-700"}`}>
          {record.status?.replace(/_/g, " ") ?? "—"}
        </span>
      </div>
      {maskAadhaar(record.aadhaarNumber) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">Aadhaar</span>
          <span className="font-semibold text-stone-700">{maskAadhaar(record.aadhaarNumber)}</span>
        </div>
      )}
      {record.panNumber && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-500">PAN</span>
          <span className="font-semibold text-stone-700">{record.panNumber}</span>
        </div>
      )}
      <div className="pt-1.5 border-t border-stone-100 space-y-2">
        <DocCheck label="Aadhaar front" present={!!record.aadhaarFrontKey} />
        <DocCheck label="Aadhaar back" present={!!record.aadhaarBackKey} />
        <DocCheck label="PAN card" present={!!record.panKey} />
        <DocCheck label="Selfie" present={!!record.selfieKey} />
        <DocCheck label={`Certificates (${record.certificateKeys?.length ?? 0})`} present={(record.certificateKeys?.length ?? 0) > 0} />
        <DocCheck label="Video KYC" present={!!record.videoKycKey} />
      </div>
      {needsResubmit && (
        <button
          onClick={onSubmit}
          className="mt-1 w-full rounded-xl bg-stone-900 text-white py-2 text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Re-submit KYC
        </button>
      )}
    </div>
  );
}

/**
 * Right slide-in drawer with everything GET /partner/employees +
 * /partner/employees/:id/kyc return for one team member. Purely
 * presentational beyond its own KYC query — Edit / Remove / Submit-KYC are
 * lifted to TeamPanel so their modals don't nest inside this Radix dialog.
 */
export default function EmployeeDetailDrawer({
  employee,
  open,
  onOpenChange,
  onEdit,
  onRemove,
  onSubmitKyc,
}: {
  employee: PartnerEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (employee: PartnerEmployee) => void;
  onRemove: (employee: PartnerEmployee) => void;
  onSubmitKyc: (employee: PartnerEmployee) => void;
}) {
  const kyc = useEmployeeKyc(open && employee ? employee.id : null);
  const status = employee ? EMPLOYEE_STATUS_STYLE[employee.status] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        aria-label="Team member details"
        className="w-full max-w-sm sm:max-w-md p-0 gap-0"
      >
        {employee && (
          <>
            <div className="px-5 pt-6 pb-4 flex items-start gap-3 border-b border-stone-100 shrink-0">
              <PartnerAvatar
                partner={{ name: employee.name, profilePhotoKey: employee.profilePhotoKey }}
                className="w-12 h-12 bg-[#FDF3E7] text-[#C9851A] text-base shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-stone-900 truncate">{employee.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">{employee.role}</p>
                {status && (
                  <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                )}
              </div>
              <SheetClose asChild>
                <button
                  className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4.5 h-4.5 text-stone-700" />
                </button>
              </SheetClose>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-3">
                <MetaRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
                <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Joined" value={formatDate(employee.joinedAt)} />
                {employee.approvedAt && (
                  <MetaRow icon={<BadgeCheck className="h-4 w-4" />} label="Approved" value={formatDate(employee.approvedAt)} />
                )}
                <MetaRow
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Availability"
                  value={employee.isActive ? "Active" : "Inactive"}
                />
              </div>

              <div>
                <p className="text-xs font-bold text-stone-700 mb-2">Specializations</p>
                {employee.specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {employee.specializations.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-[#FFF8EC] border border-[#F0DDBF] px-2.5 py-1 text-[11px] font-bold text-[#C9851A]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">None added yet.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-stone-700 mb-2">KYC</p>
                <KycSection kyc={kyc} onSubmit={() => onSubmitKyc(employee)} />
              </div>
            </div>

            <div className="border-t border-stone-100 p-4 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(employee)}
                  className="flex-1 rounded-xl border border-stone-200 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => onRemove(employee)}
                  className="flex-1 rounded-xl border border-red-200 text-red-600 py-2.5 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
