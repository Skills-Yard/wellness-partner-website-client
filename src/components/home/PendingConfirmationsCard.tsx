"use client";

import React, { useState } from "react";
import { BadgeCheck, Loader2, MapPin, UserCheck } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  usePendingTeamConfirmations,
  useConfirmTeamAssignment,
} from "@/hooks/queries/useMemberships";
import PartnerAvatar from "./PartnerAvatar";

/**
 * BUSINESS-only. A job broadcast to the team was accepted by one or more
 * members; the business picks who serves it. Confirming sets the booking's
 * partner to the business and records the employee — every other acceptance
 * for that job is released.
 */
export default function PendingConfirmationsCard() {
  const { data: pending = [], isLoading } = usePendingTeamConfirmations();
  const confirm = useConfirmTeamAssignment();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || pending.length === 0) return null;

  // Group acceptances by booking so the business chooses between people.
  const byBooking = new Map<string, typeof pending>();
  for (const row of pending) {
    const list = byBooking.get(row.bookingId) ?? [];
    list.push(row);
    byBooking.set(row.bookingId, list);
  }

  const handleConfirm = async (bookingId: string, employeePartnerId: string) => {
    const key = `${bookingId}:${employeePartnerId}`;
    setBusyKey(key);
    setError(null);
    try {
      await confirm.mutateAsync({ bookingId, employeePartnerId });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not confirm the assignment.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#F0DDBF] bg-[#FFF8EC] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4.5 w-4.5 text-[#C9851A]" />
        <p className="text-sm font-extrabold text-stone-900">
          Confirm who takes {byBooking.size === 1 ? "this job" : "these jobs"}
        </p>
      </div>
      <p className="text-[11px] text-stone-500 mt-0.5">
        A team member accepted. Confirm one to lock the assignment — if you don&apos;t,
        the earliest acceptance is confirmed automatically.
      </p>

      {error && <p className="mt-2 text-[11px] font-medium text-red-500">{error}</p>}

      <div className="mt-3 space-y-3">
        {[...byBooking.entries()].map(([bookingId, rows]) => {
          const b = rows[0].booking;
          const svc =
            b.items?.map((i) => i.serviceItemName).join(", ") || "Service booking";
          const place = [b.address?.city, b.address?.pincode].filter(Boolean).join(" · ");
          return (
            <div key={bookingId} className="rounded-xl border border-[#EAD9BC] bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-stone-900 truncate">{svc}</p>
                <span className="text-[11px] font-extrabold text-[#C9851A] shrink-0">
                  ₹{b.partnerEarning?.toFixed(0)}
                </span>
              </div>
              {place && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-400">
                  <MapPin className="h-3 w-3" /> {place}
                </p>
              )}
              <div className="mt-2.5 divide-y divide-stone-100">
                {rows.map((row) => {
                  const key = `${bookingId}:${row.employeePartnerId}`;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <PartnerAvatar
                          partner={{
                            name: row.employeePartner.name ?? "?",
                            profilePhotoKey: row.employeePartner.profilePhotoKey,
                          }}
                          className="w-7 h-7 bg-[#FDF3E7] text-[#C9851A] text-[10px] shrink-0"
                        />
                        <span className="text-xs font-semibold text-stone-800 truncate">
                          {row.employeePartner.name ?? "Team member"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleConfirm(bookingId, row.employeePartnerId)}
                        disabled={busyKey === key}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9851A] text-white px-3 py-1.5 text-[11px] font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {busyKey === key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        )}
                        Confirm
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
