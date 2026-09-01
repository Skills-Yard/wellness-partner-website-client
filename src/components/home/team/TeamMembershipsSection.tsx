"use client";

import React, { useState } from "react";
import {
  Check,
  Clock,
  Copy,
  Loader2,
  LogOut,
  UserPlus,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  useJoinCode,
  useRemoveMember,
  useRespondToJoinRequest,
  useTeam,
} from "@/hooks/queries/useMemberships";
import type { BusinessMembership } from "@/lib/api/types";
import PartnerAvatar from "../PartnerAvatar";
import TeamInviteModal from "./TeamInviteModal";

function MemberCell({ m }: { m: BusinessMembership }) {
  const p = m.employeePartner;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <PartnerAvatar
        partner={{ name: p?.name ?? "?", profilePhotoKey: p?.profilePhotoKey }}
        className="w-9 h-9 bg-[#FDF3E7] text-[#C9851A] text-xs shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-bold text-stone-900 truncate">{p?.name ?? "Partner"}</p>
        <p className="text-[11px] text-stone-400 truncate">
          {[m.role, p?.phone].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    </div>
  );
}

export default function TeamMembershipsSection() {
  const joinCode = useJoinCode();
  const pending = useTeam(["PENDING_BUSINESS_APPROVAL"]);
  const active = useTeam(["ACTIVE", "PENDING_EMPLOYEE_APPROVAL"]);
  const respond = useRespondToJoinRequest();
  const removeMember = useRemoveMember();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const requests = pending.data?.data ?? [];
  const members = active.data?.data ?? [];

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  };

  const copyCode = async () => {
    const code = joinCode.data?.businessCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is visible anyway */
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-stone-900">Team accounts</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Members who log in and take bookings on their own.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#C9851A] text-white px-3.5 py-2 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Invite / add account
        </button>
      </div>

      {/* Join code */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-stone-100 bg-stone-50/50">
        <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
          Join code
        </span>
        {joinCode.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
        ) : joinCode.data?.businessCode ? (
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-bold tracking-wider text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            {joinCode.data.businessCode}
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-stone-400" />
            )}
          </button>
        ) : (
          <span className="text-xs text-red-500">Could not load code</span>
        )}
        <span className="text-[11px] text-stone-400">
          Share this so a partner can request to join from their app.
        </span>
      </div>

      {error && <p className="px-4 py-2 text-xs font-medium text-red-500">{error}</p>}

      {/* Pending join requests */}
      {requests.length > 0 && (
        <div className="border-b border-stone-100">
          <p className="px-4 py-2 text-[11px] uppercase tracking-wide font-bold text-amber-700 bg-amber-50/60">
            {requests.length} request{requests.length === 1 ? "" : "s"} to join
          </p>
          <div className="divide-y divide-stone-100">
            {requests.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <MemberCell m={m} />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      act(m.id, () =>
                        respond.mutateAsync({ membershipId: m.id, approve: true })
                      )
                    }
                    disabled={busyId === m.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9851A] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {busyId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      act(m.id, () =>
                        respond.mutateAsync({ membershipId: m.id, approve: false })
                      )
                    }
                    disabled={busyId === m.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active + awaiting-acceptance members */}
      <div className="divide-y divide-stone-100">
        {active.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
          </div>
        ) : members.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-stone-400">
            No team accounts yet. Invite a partner or create an account above.
          </p>
        ) : (
          members.map((m) => {
            const awaiting = m.status === "PENDING_EMPLOYEE_APPROVAL";
            return (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <MemberCell m={m} />
                <div className="flex items-center gap-2 shrink-0">
                  {awaiting ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-500 px-2.5 py-1 text-[11px] font-bold">
                      <Clock className="h-3.5 w-3.5" /> Awaiting acceptance
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> Active
                    </span>
                  )}
                  <button
                    onClick={() =>
                      act(m.id, () => removeMember.mutateAsync({ membershipId: m.id }))
                    }
                    disabled={busyId === m.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {busyId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    {awaiting ? "Cancel" : "Remove"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TeamInviteModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
