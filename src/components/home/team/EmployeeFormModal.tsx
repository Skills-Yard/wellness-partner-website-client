"use client";

import React, { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/queries/useEmployees";
import type { PartnerEmployee } from "@/lib/api/types";
import { EMPLOYEE_ROLES } from "./constants";

const OTHER = "__other__";

function SpecializationsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
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
          {value.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 rounded-full bg-[#FFF8EC] border border-[#F0DDBF] px-2.5 py-1 text-xs font-bold text-[#C9851A]"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== s))}
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
              add();
            }
          }}
          placeholder="Add a specialization, press Enter"
          className="flex-1 rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// The form body — remounted (via key) by the wrapper whenever the target
// employee changes, so every field just initialises straight from props and
// no reset effect is needed.
function EmployeeForm({
  employee,
  onDone,
}: {
  employee: PartnerEmployee | null;
  onDone: (saved?: PartnerEmployee) => void;
}) {
  const isEdit = !!employee;
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const saving = createEmployee.isPending || updateEmployee.isPending;

  const rolePreset = employee ? (EMPLOYEE_ROLES as readonly string[]).includes(employee.role) : true;

  const [name, setName] = useState(employee?.name ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [roleSelect, setRoleSelect] = useState<string>(
    employee ? (rolePreset ? employee.role : OTHER) : EMPLOYEE_ROLES[0]
  );
  const [roleOther, setRoleOther] = useState(employee && !rolePreset ? employee.role : "");
  const [specializations, setSpecializations] = useState<string[]>(employee?.specializations ?? []);
  const [isActive, setIsActive] = useState(employee?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const resolvedRole = roleSelect === OTHER ? roleOther.trim() : roleSelect;
  const errors = {
    name: name.trim() ? null : "Enter the team member's name.",
    phone: /^\d{10}$/.test(phone.trim()) ? null : "Enter a 10-digit phone number.",
    role: resolvedRole ? null : "Choose or type a role.",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const handleSave = async () => {
    if (saving) return;
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setError(null);
    try {
      const result = employee
        ? await updateEmployee.mutateAsync({
            id: employee.id,
            data: {
              name: name.trim(),
              phone: phone.trim(),
              role: resolvedRole,
              specializations,
              isActive,
            },
          })
        : await createEmployee.mutateAsync({
            name: name.trim(),
            phone: phone.trim(),
            role: resolvedRole,
            specializations,
          });
      onDone(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this team member.");
    }
  };

  const fieldClass = (invalid: string | null) =>
    `w-full rounded-xl border bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:bg-white transition-all ${
      showErrors && invalid ? "border-red-300 focus:border-red-400" : "border-stone-200 focus:border-amber-500"
    }`;

  return (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <DialogTitle className="text-base font-extrabold text-stone-900">
          {isEdit ? "Edit team member" : "Add team member"}
        </DialogTitle>
      </div>

      <div className="px-5 py-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Full name</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass(errors.name)} />
          {showErrors && errors.name && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.name}</p>}
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Phone number</p>
          <input
            value={phone}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className={fieldClass(errors.phone)}
          />
          {showErrors && errors.phone && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Role</p>
          <select
            value={roleSelect}
            onChange={(e) => setRoleSelect(e.target.value)}
            className={fieldClass(roleSelect === OTHER ? null : errors.role)}
          >
            {EMPLOYEE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value={OTHER}>Other…</option>
          </select>
          {roleSelect === OTHER && (
            <input
              value={roleOther}
              onChange={(e) => setRoleOther(e.target.value)}
              placeholder="Type the role"
              className={`mt-2 ${fieldClass(errors.role)}`}
            />
          )}
          {showErrors && errors.role && <p className="mt-1 text-[11px] font-medium text-red-500">{errors.role}</p>}
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Specializations</p>
          <SpecializationsInput value={specializations} onChange={setSpecializations} />
        </div>

        {isEdit && (
          <label className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 cursor-pointer">
            <span className="text-xs font-bold text-stone-700">Active</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#C9851A] cursor-pointer"
            />
          </label>
        )}

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50/60">
        <button
          onClick={() => onDone()}
          disabled={saving}
          className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-[#C9851A] text-white py-2.5 text-sm font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Add member"}
        </button>
      </div>
    </>
  );
}

/**
 * Mini popup for adding a team member (POST /partner/employees) or editing
 * one (PATCH /partner/employees/:id). Edit mode also exposes the active
 * toggle. Photo isn't set here — there's no create-time employee id to
 * attach an upload to; the detail drawer handles photo on an existing
 * employee.
 *
 * Radix unmounts DialogContent on close, and the inner form is keyed on the
 * employee id, so the fields reseed from props on every open without a reset
 * effect.
 */
export default function EmployeeFormModal({
  open,
  onOpenChange,
  employee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: PartnerEmployee | null;
  onSaved: (employee: PartnerEmployee) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-0 overflow-hidden">
        <EmployeeForm
          key={employee?.id ?? "new"}
          employee={employee ?? null}
          onDone={(saved) => {
            if (saved) onSaved(saved);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
