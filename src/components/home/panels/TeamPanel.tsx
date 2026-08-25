"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import DocumentUploadField from "@/components/kyc/DocumentUploadField";
import { uploadEmployeeKycFile } from "@/lib/api/upload";
import * as employeesApi from "@/lib/api/employees";
import { ApiError } from "@/lib/api/client";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { LoadMoreButton } from "@/components/ui/load-more-button";
import type { PartnerEmployee } from "@/lib/api/types";

function EmployeeKycInline({ employeeId }: { employeeId: string }) {
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFrontKey, setAadhaarFrontKey] = useState<string | null>(null);
  const [aadhaarBackKey, setAadhaarBackKey] = useState<string | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [panKey, setPanKey] = useState<string | null>(null);
  const [selfieKey, setSelfieKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = (file: File) => uploadEmployeeKycFile(employeeId, file);
  const isValid = Boolean(aadhaarNumber.trim() && aadhaarFrontKey && aadhaarBackKey && panNumber.trim() && panKey && selfieKey);

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await employeesApi.submitEmployeeKyc(employeeId, {
        aadhaarNumber: aadhaarNumber.trim(),
        aadhaarFrontKey: aadhaarFrontKey!,
        aadhaarBackKey: aadhaarBackKey!,
        panNumber: panNumber.trim().toUpperCase(),
        panKey: panKey!,
        selfieKey: selfieKey!,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit KYC.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return <p className="text-xs font-semibold text-green-600 py-2">KYC submitted for review.</p>;

  return (
    <div className="space-y-3 pt-2">
      <div>
        <p className="text-[11px] font-bold text-stone-700 mb-1">Aadhaar number</p>
        <input
          value={aadhaarNumber}
          onChange={(e) => setAadhaarNumber(e.target.value)}
          className="w-full text-xs rounded-lg border border-stone-200 px-3 py-2 bg-white outline-none"
        />
      </div>
      <DocumentUploadField label="Aadhaar front" value={aadhaarFrontKey} onChange={setAadhaarFrontKey} upload={upload} required />
      <DocumentUploadField label="Aadhaar back" value={aadhaarBackKey} onChange={setAadhaarBackKey} upload={upload} required />
      <div>
        <p className="text-[11px] font-bold text-stone-700 mb-1">PAN number</p>
        <input
          value={panNumber}
          onChange={(e) => setPanNumber(e.target.value)}
          className="w-full text-xs rounded-lg border border-stone-200 px-3 py-2 bg-white outline-none"
        />
      </div>
      <DocumentUploadField label="PAN card photo" value={panKey} onChange={setPanKey} upload={upload} required />
      <DocumentUploadField label="Selfie" value={selfieKey} onChange={setSelfieKey} upload={upload} required />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <button
        onClick={submit}
        disabled={!isValid || loading}
        className="w-full rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Submit employee KYC
      </button>
    </div>
  );
}

function AddEmployeeForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = Boolean(name.trim() && /^\d{10}$/.test(phone.trim()) && role.trim());

  const submit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      await employeesApi.createEmployee({ name: name.trim(), phone: phone.trim(), role: role.trim() });
      setName("");
      setPhone("");
      setRole("");
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add this team member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-[#FAF9F6] p-4 space-y-2.5">
      <p className="text-xs font-bold text-stone-700">Add team member</p>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs rounded-lg border border-stone-200 px-3 py-2 bg-white outline-none" />
      <input placeholder="10-digit phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="w-full text-xs rounded-lg border border-stone-200 px-3 py-2 bg-white outline-none" />
      <input placeholder="Role (e.g. Therapist)" value={role} onChange={(e) => setRole(e.target.value)} className="w-full text-xs rounded-lg border border-stone-200 px-3 py-2 bg-white outline-none" />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
      <button
        onClick={submit}
        disabled={!isValid || loading}
        className="w-full rounded-xl py-2.5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Add member
      </button>
    </div>
  );
}

export default function TeamPanel({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { items: employees, isLoading, isFetchingNextPage, hasMore, loadMore, refetch } =
    usePaginatedList<PartnerEmployee>(
      ["partner-employees"],
      (page, limit) => employeesApi.getEmployeesPage(page, limit),
      { limit: 20 }
    );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-lg font-extrabold text-stone-900">Team</h1>
      </div>

      <div className="px-5 max-w-lg w-full space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}

        {employees.map((emp) => {
          const isOpen = expanded === emp.id;
          return (
            <div key={emp.id} className="rounded-2xl border border-stone-100 bg-[#FAF9F6] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : emp.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-stone-800">{emp.name}</p>
                  <p className="text-[11px] text-stone-400">
                    {emp.role} · {emp.status.replace(/_/g, " ")}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  {emp.status === "PENDING_KYC" ? (
                    <EmployeeKycInline employeeId={emp.id} />
                  ) : (
                    <p className="text-xs text-stone-500">KYC status: {emp.status.replace(/_/g, " ")}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {hasMore && <LoadMoreButton onClick={loadMore} loading={isFetchingNextPage} />}

        {showAdd ? (
          <AddEmployeeForm
            onAdded={() => {
              setShowAdd(false);
              void refetch();
            }}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-2xl border border-dashed border-stone-200 py-3.5 text-xs font-bold text-stone-500 hover:bg-stone-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add team member
          </button>
        )}
      </div>
    </div>
  );
}
