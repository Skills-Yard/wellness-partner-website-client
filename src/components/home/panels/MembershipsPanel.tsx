"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Loader2,
  LogOut,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useLeaveBusiness,
  useMyMemberships,
  useRequestToJoinBusiness,
  useRespondToInvite,
} from "@/hooks/queries/useMemberships";
import type { BusinessMembership } from "@/lib/api/types";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function BusinessCell({ m }: { m: BusinessMembership }) {
  const name = m.businessPartner?.name ?? "A business";
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-9 h-9 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] shrink-0">
        <Building2 className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-stone-900 truncate">{name}</p>
        {m.role && <p className="text-[11px] text-stone-400 truncate">{m.role}</p>}
      </div>
    </div>
  );
}

function JoinByCode() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const requestJoin = useRequestToJoinBusiness();

  const submit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || requestJoin.isPending) return;
    setMsg(null);
    try {
      await requestJoin.mutateAsync({ businessCode: trimmed });
      setCode("");
      setMsg({ kind: "ok", text: "Request sent. The business will review it." });
    } catch (err) {
      setMsg({
        kind: "err",
        text: err instanceof ApiError ? err.message : "Could not send the request.",
      });
    }
  };

  return (
    <div className="rounded-xl border border-stone-200/70 bg-white p-4 sm:p-5">
      <p className="text-sm font-bold text-stone-900">Join a business</p>
      <p className="text-xs text-stone-500 mt-0.5">
        Enter the join code a business shared with you. They&apos;ll approve your request.
      </p>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. ACME-7F3K"
          className="flex-1 rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2.5 text-sm tracking-wider outline-none focus:border-amber-500 focus:bg-white transition-all"
        />
        <button
          onClick={submit}
          disabled={requestJoin.isPending || !code.trim()}
          className="rounded-xl bg-[#C9851A] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {requestJoin.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send request
        </button>
      </div>
      {msg && (
        <p
          className={`mt-2 text-[11px] font-medium ${
            msg.kind === "ok" ? "text-green-600" : "text-red-500"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}

export default function MembershipsPanel({ onBack }: { onBack: () => void }) {
  const { refreshProfile } = useAuth();
  const { data: memberships = [], isLoading, isError, error } = useMyMemberships();
  const respond = useRespondToInvite();
  const leave = useLeaveBusiness();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const { invites, requests, active, past } = useMemo(() => {
    return {
      invites: memberships.filter((m) => m.status === "PENDING_EMPLOYEE_APPROVAL"),
      requests: memberships.filter((m) => m.status === "PENDING_BUSINESS_APPROVAL"),
      active: memberships.filter((m) => m.status === "ACTIVE"),
      past: memberships.filter((m) =>
        ["REJECTED", "REVOKED", "LEFT"].includes(m.status)
      ),
    };
  }, [memberships]);

  const runAction = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setRowError(null);
    try {
      await fn();
      await refreshProfile();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col pb-28 lg:pb-10">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pt-6">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-stone-900">Business memberships</h1>
            <p className="text-sm text-stone-500 mt-1">
              Businesses you work with. Joining one doesn&apos;t change how your own
              bookings, availability or payouts work.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <JoinByCode />

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
            </div>
          )}
          {isError && !isLoading && (
            <p className="text-xs font-medium text-red-500">
              {error instanceof ApiError ? error.message : "Could not load your memberships."}
            </p>
          )}

          {rowError && <p className="text-xs font-medium text-red-500">{rowError}</p>}

          {!isLoading && !isError && (
            <>
              {invites.length > 0 && (
                <Section title="Invitations">
                  {invites.map((m) => (
                    <Row key={m.id} m={m}>
                      <button
                        onClick={() =>
                          runAction(m.id, () =>
                            respond.mutateAsync({ membershipId: m.id, accept: true })
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
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          runAction(m.id, () =>
                            respond.mutateAsync({ membershipId: m.id, accept: false })
                          )
                        }
                        disabled={busyId === m.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" /> Decline
                      </button>
                    </Row>
                  ))}
                </Section>
              )}

              {requests.length > 0 && (
                <Section title="Pending requests">
                  {requests.map((m) => (
                    <Row key={m.id} m={m}>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[11px] font-bold">
                        <Clock className="h-3.5 w-3.5" /> Awaiting approval
                      </span>
                    </Row>
                  ))}
                </Section>
              )}

              {active.length > 0 && (
                <Section title="Active">
                  {active.map((m) => (
                    <Row key={m.id} m={m} sub={`Since ${fmtDate(m.respondedAt)}`}>
                      <button
                        onClick={() =>
                          runAction(m.id, () => leave.mutateAsync({ membershipId: m.id }))
                        }
                        disabled={busyId === m.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {busyId === m.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LogOut className="h-3.5 w-3.5" />
                        )}
                        Leave
                      </button>
                    </Row>
                  ))}
                </Section>
              )}

              {past.length > 0 && (
                <Section title="Past">
                  {past.map((m) => (
                    <Row key={m.id} m={m} sub={m.status.toLowerCase()} muted />
                  ))}
                </Section>
              )}

              {memberships.length === 0 && (
                <div className="flex flex-col items-center text-center py-14">
                  <div className="w-12 h-12 rounded-full bg-[#FDF3E7] flex items-center justify-center text-[#C9851A] mb-3">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-stone-900">No memberships yet</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Use a join code above, or wait for a business to invite you.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200/70 bg-white overflow-hidden">
      <p className="px-4 py-2.5 text-[11px] uppercase tracking-wide font-bold text-stone-500 bg-stone-50/70 border-b border-stone-100">
        {title}
      </p>
      <div className="divide-y divide-stone-100">{children}</div>
    </div>
  );
}

function Row({
  m,
  children,
  sub,
  muted,
}: {
  m: BusinessMembership;
  children?: React.ReactNode;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <BusinessCell m={m} />
        {sub && <p className="text-[11px] text-stone-400 mt-1 capitalize">{sub}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}
