import type { EmployeeStatus } from "@/lib/api/types";

// The backend stores `role` as a free string (existing data has values like
// "Spa"), so this is a convenience shortlist, not an enum — the form falls
// back to a free-text field via the "Other" option for anything not here.
export const EMPLOYEE_ROLES = [
  "Therapist",
  "Beautician",
  "Masseuse",
  "Trainer",
  "Manager",
  "Receptionist",
] as const;

export const EMPLOYEE_STATUS_STYLE: Record<EmployeeStatus, { label: string; cls: string }> = {
  PENDING_KYC: { label: "Pending KYC", cls: "bg-amber-50 text-amber-700" },
  KYC_SUBMITTED: { label: "KYC in review", cls: "bg-blue-50 text-blue-700" },
  TRAINING: { label: "In training", cls: "bg-blue-50 text-blue-700" },
  PENDING_APPROVAL: { label: "Pending approval", cls: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Active", cls: "bg-green-50 text-green-700" },
  SUSPENDED: { label: "Suspended", cls: "bg-red-50 text-red-700" },
  REJECTED: { label: "Rejected", cls: "bg-red-50 text-red-700" },
  DEACTIVATED: { label: "Deactivated", cls: "bg-stone-100 text-stone-500" },
};
