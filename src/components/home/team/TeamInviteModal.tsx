"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import {
  useCreateEmployeeAccount,
  useInvitePartner,
} from "@/hooks/queries/useMemberships";

type Mode = "invite" | "create";

/**
 * Adds a *login-capable* team member via BusinessMembership:
 *   - "invite"  — the phone already has a partner account; send an invite
 *                 they accept in their own app.
 *   - "create"  — provision a new partner account for the phone and add them;
 *                 activates when that person first logs in and accepts.
 *
 * Distinct from EmployeeFormModal, which manages non-login "managed staff"
 * (PartnerEmployee rows).
 */
export default function TeamInviteModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl bg-white p-0 overflow-hidden">
        <InviteForm key={open ? "open" : "closed"} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("invite");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const invite = useInvitePartner();
  const create = useCreateEmployeeAccount();
  const busy = invite.isPending || create.isPending;

  const phoneValid = /^\d{10}$/.test(phone.trim());
  const valid = phoneValid && (mode === "invite" || name.trim().length >= 2);

  const submit = async () => {
    if (!valid || busy) return;
    setError(null);
    setOk(null);
    try {
      if (mode === "invite") {
        await invite.mutateAsync({
          phone: phone.trim(),
          role: role.trim() || undefined,
        });
        setOk("Invitation sent. They'll see it in their partner app.");
      } else {
        const res = await create.mutateAsync({
          name: name.trim(),
          phone: phone.trim(),
          role: role.trim() || undefined,
        });
        setOk(
          res.accountCreated
            ? "Account created. They can log in with this phone and accept."
            : "That phone already has an account — an invitation was sent instead."
        );
      }
      setName("");
      setPhone("");
      setRole("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add this member.");
    }
  };

  return (
    <>
      <div className="px-5 pt-5 pb-4 border-b border-stone-100">
        <DialogTitle className="text-base font-extrabold text-stone-900">
          Add a team account
        </DialogTitle>
        <p className="text-xs text-stone-400 mt-0.5">
          A team account can log in and take bookings on their own.
        </p>
      </div>

      <div className="px-5 py-4 space-y-3.5">
        <div className="flex gap-1.5 rounded-xl bg-stone-100 p-1">
          {(["invite", "create"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setOk(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                mode === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              }`}
            >
              {m === "invite" ? "Invite existing partner" : "Create new account"}
            </button>
          ))}
        </div>

        {mode === "create" && (
          <div>
            <p className="text-xs font-bold text-stone-700 mb-1.5">Full name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Phone number</p>
          <input
            value={phone}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile"
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <p className="text-xs font-bold text-stone-700 mb-1.5">Role (optional)</p>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Massage therapist"
            className="w-full rounded-xl border border-stone-200 bg-[#F9F6F0] px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        {ok && <p className="text-xs font-medium text-green-600">{ok}</p>}
      </div>

      <div className="flex gap-2 px-5 py-4 border-t border-stone-100 bg-stone-50/60">
        <button
          onClick={onDone}
          disabled={busy}
          className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600 hover:bg-white transition-colors cursor-pointer disabled:opacity-60"
        >
          {ok ? "Done" : "Cancel"}
        </button>
        <button
          onClick={submit}
          disabled={busy || !valid}
          className="flex-1 rounded-xl bg-[#C9851A] text-white py-2.5 text-sm font-bold hover:bg-[#B67714] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "invite" ? "Send invite" : "Create & add"}
        </button>
      </div>
    </>
  );
}
