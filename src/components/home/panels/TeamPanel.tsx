"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEmployees, useRemoveEmployee } from "@/hooks/queries/useEmployees";
import type { PartnerEmployee } from "@/lib/api/types";
import PartnerAvatar from "../PartnerAvatar";
import { EMPLOYEE_STATUS_STYLE } from "../team/constants";
import EmployeeFormModal from "../team/EmployeeFormModal";
import EmployeeKycModal from "../team/EmployeeKycModal";
import EmployeeDetailDrawer from "../team/EmployeeDetailDrawer";

function EmployeeCard({
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
  const status = EMPLOYEE_STATUS_STYLE[employee.status];
  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-4 flex flex-col">
      <button
        onClick={() => onOpen(employee)}
        className="flex items-start gap-3 text-left cursor-pointer group"
      >
        <PartnerAvatar
          partner={{ name: employee.name, profilePhotoKey: employee.profilePhotoKey }}
          className="w-11 h-11 bg-[#FDF3E7] text-[#C9851A] text-sm shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-850 truncate group-hover:text-[#C9851A] transition-colors">
            {employee.name}
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">{employee.role}</p>
          {status && (
            <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
              {status.label}
            </span>
          )}
        </div>
      </button>

      {employee.specializations.length > 0 && (
        <p className="text-[11px] text-stone-400 mt-2.5 truncate">
          {employee.specializations.join(" · ")}
        </p>
      )}

      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-50">
        <button
          onClick={() => onEdit(employee)}
          className="flex-1 rounded-lg border border-stone-200 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          onClick={() => onRemove(employee)}
          className="flex-1 rounded-lg border border-red-200 text-red-600 py-1.5 text-[11px] font-bold hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
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
 * employee (GET /partner/employees), opens a right-side detail drawer per
 * member, and hangs the add/edit popup, the KYC popup and the remove
 * confirm off this one screen so their dialogs stay siblings rather than
 * nesting arbitrarily deep.
 */
export default function TeamPanel({ onBack }: { onBack: () => void }) {
  const { data: employees = [], isLoading, isError, error } = useEmployees(true);

  const [detailEmployee, setDetailEmployee] = useState<PartnerEmployee | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formEmployee, setFormEmployee] = useState<PartnerEmployee | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [kycEmployee, setKycEmployee] = useState<PartnerEmployee | null>(null);
  const [kycOpen, setKycOpen] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<PartnerEmployee | null>(null);

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

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 sm:px-8 pt-6 pb-4 flex items-center gap-3 max-w-4xl w-full mx-auto">
        <button
          onClick={onBack}
          className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900 flex-1">
          Team
          {employees.length > 0 && (
            <span className="ml-1.5 font-semibold text-stone-400">({employees.length})</span>
          )}
        </h1>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#C9851A] text-white px-3.5 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add member
        </button>
      </div>

      <div className="px-5 sm:px-8 max-w-4xl w-full mx-auto flex-1">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}

        {isError && !isLoading && (
          <p className="text-xs font-medium text-red-500 py-4">
            {error instanceof ApiError ? error.message : "Could not load your team."}
          </p>
        )}

        {!isLoading && !isError && employees.length === 0 && (
          <div className="flex flex-col items-center text-center py-20">
            <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] mb-3">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-stone-900">No team members yet</p>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Add the people who deliver services on your behalf.
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-xl bg-[#C9851A] text-white px-4 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add team member
            </button>
          </div>
        )}

        {employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onOpen={openDetail}
                onEdit={openEdit}
                onRemove={(e) => setRemoveTarget(e)}
              />
            ))}
          </div>
        )}
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
