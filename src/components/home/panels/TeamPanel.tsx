"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter as FilterIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEmployees, useRemoveEmployee } from "@/hooks/queries/useEmployees";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { PartnerEmployee } from "@/lib/api/types";
import PartnerAvatar from "../PartnerAvatar";
import { EMPLOYEE_STATUS_STYLE } from "../team/constants";
import EmployeeFormModal from "../team/EmployeeFormModal";
import EmployeeKycModal from "../team/EmployeeKycModal";
import EmployeeDetailDrawer from "../team/EmployeeDetailDrawer";
import TeamMembershipsSection from "../team/TeamMembershipsSection";

const PAGE_SIZE = 8;

function formatJoined(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// The green/grey "Status" column value — the employee's operational state
// (can they be assigned work), distinct from the onboarding/KYC badge shown
// under their name.
function deriveStatus(employee: PartnerEmployee): { label: string; cls: string } {
  if (employee.status === "SUSPENDED") return { label: "Suspended", cls: "text-red-600" };
  if (employee.status === "REJECTED") return { label: "Rejected", cls: "text-red-600" };
  if (employee.status === "DEACTIVATED" || !employee.isActive)
    return { label: "Inactive", cls: "text-stone-500" };
  return { label: "Active", cls: "text-green-600" };
}

type FilterKey = "all" | "active" | "inactive" | "pending_kyc" | "kyc_submitted" | "suspended";

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All members" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "On leave / inactive" },
  { key: "pending_kyc", label: "Pending KYC" },
  { key: "kyc_submitted", label: "KYC in review" },
  { key: "suspended", label: "Suspended" },
];

function matchesFilter(employee: PartnerEmployee, filter: FilterKey) {
  switch (filter) {
    case "active":
      return employee.isActive && employee.status !== "SUSPENDED";
    case "inactive":
      return !employee.isActive || employee.status === "DEACTIVATED";
    case "pending_kyc":
      return employee.status === "PENDING_KYC";
    case "kyc_submitted":
      return employee.status === "KYC_SUBMITTED";
    case "suspended":
      return employee.status === "SUSPENDED";
    default:
      return true;
  }
}

function StatCard({
  icon,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200/70 bg-white p-4 sm:p-5 flex items-start gap-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <span className="w-11 h-11 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-stone-900 leading-none">{value}</p>
        <p className="text-[13px] font-bold text-stone-800 mt-1.5">{label}</p>
        <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function FilterMenu({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (next: FilterKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = FILTER_OPTIONS.find((o) => o.key === value) ?? FILTER_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
      >
        <FilterIcon className="h-4 w-4" />
        {value === "all" ? "Filter" : active.label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute right-0 z-30 mt-1.5 w-52 rounded-xl border border-stone-200 bg-white p-1 shadow-lg">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                  option.key === value
                    ? "bg-[#FDF3E7] font-bold text-[#C9851A]"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeamRow({
  employee,
  onOpen,
  onEdit,
  onRemove,
}: {
  employee: PartnerEmployee;
  onOpen: (employee: PartnerEmployee) => void;
  onEdit: (employee: PartnerEmployee) => void;
  onRemove: (employee: PartnerEmployee) => void;
}) {
  const onboarding = employee.status !== "APPROVED" ? EMPLOYEE_STATUS_STYLE[employee.status] : null;
  const status = deriveStatus(employee);
  const available = employee.isActive && employee.status !== "SUSPENDED";

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50/50 transition-colors">
      <td className="px-5 py-4">
        <button
          onClick={() => onOpen(employee)}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <PartnerAvatar
            partner={{ name: employee.name, profilePhotoKey: employee.profilePhotoKey }}
            className="w-9 h-9 bg-[#FDF3E7] text-[#C9851A] text-xs shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate group-hover:text-[#C9851A] transition-colors">
              {employee.name}
            </p>
            {onboarding && (
              <span
                className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${onboarding.cls}`}
              >
                {onboarding.label}
              </span>
            )}
          </div>
        </button>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm text-stone-800">{employee.role || "—"}</p>
        {employee.specializations.length > 0 && (
          <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-55">
            {employee.specializations.join(" · ")}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            available ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {available ? "Active" : "Inactive"}
        </span>
        <p className="text-[11px] text-stone-400 mt-1">
          {available ? "Available for bookings" : "Not taking bookings"}
        </p>
      </td>

      <td className="px-5 py-4 text-sm text-stone-600 whitespace-nowrap">
        {formatJoined(employee.joinedAt)}
      </td>

      <td className="px-5 py-4">
        <span className={`text-sm font-bold ${status.cls}`}>{status.label}</span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(employee)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => onRemove(employee)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

function RemoveConfirmDialog({
  employee,
  onClose,
  onRemoved,
}: {
  employee: PartnerEmployee | null;
  onClose: () => void;
  onRemoved: (id: string) => void;
}) {
  const removeEmployee = useRemoveEmployee();
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!employee || removeEmployee.isPending) return;
    setError(null);
    try {
      await removeEmployee.mutateAsync(employee.id);
      onRemoved(employee.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove this team member.");
    }
  };

  return (
    <Dialog
      open={!!employee}
      onOpenChange={(next) => {
        if (!next && !removeEmployee.isPending) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent
        showCloseButton={!removeEmployee.isPending}
        className="max-w-sm rounded-2xl bg-white p-0 overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 text-center border-b border-stone-100">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-500">
            <Trash2 className="h-4.5 w-4.5" />
          </span>
          <DialogTitle className="mt-3 text-base font-extrabold text-stone-900">
            Remove team member?
          </DialogTitle>
          <p className="mt-1 text-xs text-stone-500">
            {employee
              ? `${employee.name} will be removed from your team. This can't be undone.`
              : ""}
          </p>
        </div>
        <div className="px-5 py-4">
          {error && <p className="text-xs font-medium text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={removeEmployee.isPending}
              className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              Keep
            </button>
            <button
              onClick={handleRemove}
              disabled={removeEmployee.isPending}
              className="flex-1 rounded-xl bg-red-500 text-white py-2.5 text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {removeEmployee.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remove
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Team management for BUSINESS partners — reachable from the Sidebar / the
 * "Team" manage card, both gated to approved business partners. Lists every
 * employee (GET /partner/employees) in a filterable, paginated table, opens
 * a right-side detail drawer per member, and hangs the add/edit popup, the
 * KYC popup and the remove confirm off this one screen so their dialogs stay
 * siblings rather than nesting arbitrarily deep. Search / filter / paging
 * are all client-side over the fully-fetched list (getEmployees walks every
 * backend page).
 */
export default function TeamPanel({ onBack }: { onBack: () => void }) {
  const { data: employees = [], isLoading, isError, error } = useEmployees(true);

  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search).trim().toLowerCase();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  const [detailEmployee, setDetailEmployee] = useState<PartnerEmployee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formEmployee, setFormEmployee] = useState<PartnerEmployee | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [kycEmployee, setKycEmployee] = useState<PartnerEmployee | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<PartnerEmployee | null>(null);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.isActive && e.status !== "SUSPENDED").length;
    return {
      total: employees.length,
      active,
      onLeave: employees.length - active,
      invited: employees.filter((e) => e.status === "PENDING_KYC").length,
    };
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (!matchesFilter(e, filter)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        e.specializations.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [employees, filter, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => totalPages <= 7 || n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1
  );

  const openDetail = (employee: PartnerEmployee) => {
    setDetailEmployee(employee);
    setDetailOpen(true);
  };
  const openAdd = () => {
    setFormEmployee(null);
    setFormOpen(true);
  };
  const openEdit = (employee: PartnerEmployee) => {
    setFormEmployee(employee);
    setFormOpen(true);
  };
  const openKyc = (employee: PartnerEmployee) => {
    setKycEmployee(employee);
    setKycOpen(true);
  };

  // The list refetches itself via react-query after any mutation — re-point
  // the open drawer at the fresh row so an edit shows immediately.
  const currentDetail = detailEmployee
    ? employees.find((e) => e.id === detailEmployee.id) ?? detailEmployee
    : null;

  const rangeStart = filtered.length === 0 ? 0 : startIdx + 1;
  const rangeEnd = Math.min(startIdx + PAGE_SIZE, filtered.length);

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col pb-28 lg:pb-10">
      <div className="w-full max-w-350 mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-stone-900">Team</h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage your team members and their details.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#C9851A] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add member
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            value={stats.total}
            label="Total members"
            sub="Active team members"
          />
          <StatCard
            icon={<Briefcase className="h-5 w-5" />}
            value={stats.active}
            label="Active"
            sub="Currently working"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            value={stats.onLeave}
            label="On leave"
            sub="Not working today"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5" />}
            value={stats.invited}
            label="Invited"
            sub="Pending invitations"
          />
        </div>

        {/* Login-capable team members (BusinessMembership) — invites, join
            requests, and active accounts. */}
        <TeamMembershipsSection />

        {/* Managed staff (PartnerEmployee) — non-login people the business
            submits KYC/training for on their behalf. */}
        <h3 className="mt-8 text-base font-extrabold text-stone-900">Managed staff</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          People who don&apos;t log in — you handle their KYC and training.
        </p>

        {/* Table card */}
        <div className="mt-3 rounded-xl border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-55 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search team members..."
                className="w-full rounded-lg border border-stone-200 py-2.5 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
              />
            </div>
            <FilterMenu
              value={filter}
              onChange={(next) => {
                setFilter(next);
                setPage(1);
              }}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20 border-t border-stone-100">
              <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
            </div>
          )}

          {isError && !isLoading && (
            <p className="text-xs font-medium text-red-500 px-5 py-6 border-t border-stone-100">
              {error instanceof ApiError ? error.message : "Could not load your team."}
            </p>
          )}

          {!isLoading && !isError && (
            <>
              <div className="overflow-x-auto border-t border-stone-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50/70 text-[11px] uppercase tracking-wide text-stone-500">
                      <th className="px-5 py-3 text-left font-bold">Member</th>
                      <th className="px-5 py-3 text-left font-bold">Role / Specialization</th>
                      <th className="px-5 py-3 text-left font-bold">Availability</th>
                      <th className="px-5 py-3 text-left font-bold">Joined on</th>
                      <th className="px-5 py-3 text-left font-bold">Status</th>
                      <th className="px-5 py-3 text-left font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((employee) => (
                      <TeamRow
                        key={employee.id}
                        employee={employee}
                        onOpen={openDetail}
                        onEdit={openEdit}
                        onRemove={(e) => setRemoveTarget(e)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center text-center py-16 border-t border-stone-100">
                  <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-stone-900">
                    {employees.length === 0 ? "No team members yet" : "No members match your filters"}
                  </p>
                  <p className="text-xs text-stone-500 mt-1 mb-4">
                    {employees.length === 0
                      ? "Add the people who deliver services on your behalf."
                      : "Try a different search term or filter."}
                  </p>
                  {employees.length === 0 && (
                    <button
                      onClick={openAdd}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9851A] text-white px-4 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add team member
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100">
                <p className="text-xs text-stone-500">
                  Showing {rangeStart} to {rangeEnd} of {filtered.length}{" "}
                  {filtered.length === 1 ? "member" : "members"}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageNumbers.map((n, i) => {
                    const prev = pageNumbers[i - 1];
                    const gap = prev && n - prev > 1;
                    return (
                      <React.Fragment key={n}>
                        {gap && <span className="px-1 text-stone-400">…</span>}
                        <button
                          onClick={() => setPage(n)}
                          className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            n === currentPage
                              ? "bg-[#FDF3E7] text-[#C9851A] border border-[#F0DDBF]"
                              : "border border-stone-200 text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          {n}
                        </button>
                      </React.Fragment>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help banner */}
        <div className="mt-5 rounded-xl bg-[#FDF3E7]/70 border border-[#F0DDBF] p-4 sm:p-5 flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-[#FBE7CC] flex items-center justify-center text-[#C9851A] shrink-0">
            <UserPlus className="h-6 w-6" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900">Need help adding team members?</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Add trusted professionals to your team and grow your business.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#E0C79E] bg-white px-3.5 py-2 text-xs font-bold text-[#C9851A] hover:bg-[#FFF8EC] transition-colors cursor-pointer"
          >
            Learn more <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <EmployeeDetailDrawer
        employee={currentDetail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
        onRemove={(e) => setRemoveTarget(e)}
        onSubmitKyc={openKyc}
      />

      <EmployeeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={formEmployee}
        onSaved={(saved) => {
          if (detailEmployee && detailEmployee.id === saved.id) setDetailEmployee(saved);
        }}
      />

      {kycEmployee && (
        <EmployeeKycModal
          open={kycOpen}
          onOpenChange={setKycOpen}
          employeeId={kycEmployee.id}
          employeeName={kycEmployee.name}
          onSubmitted={() => {
            /* react-query invalidation (useSubmitEmployeeKyc) refreshes the
               drawer's KYC query and the employee list on its own */
          }}
        />
      )}

      <RemoveConfirmDialog
        employee={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onRemoved={(id) => {
          setRemoveTarget(null);
          if (detailEmployee?.id === id) setDetailOpen(false);
        }}
      />
    </div>
  );
}
