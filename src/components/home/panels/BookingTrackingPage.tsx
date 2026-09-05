"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  StickyNote,
  UserX,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import * as bookingsApi from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { isBookingOverdue } from "@/lib/bookingSchedule";
import { onPartnerSocketEvent } from "@/lib/socket/partnerSocket";
import type { Booking, BookingStatus } from "@/lib/api/types";
import StartServiceModal from "@/components/booking/StartServiceModal";
import CancelBookingModal from "@/components/booking/CancelBookingModal";
import DisputeBookingModal from "@/components/booking/DisputeBookingModal";

// Same gating BookingsPanel used inline — mirrors the backend's own
// (PaymentService.NON_CANCELLABLE_STATUSES / DISPUTABLE_STATUSES) so a
// button only ever shows when the call it fires would actually succeed.
const CANCELLABLE_STATUSES: BookingStatus[] = ["ACCEPTED", "CONFIRMED", "PARTNER_EN_ROUTE", "PARTNER_ARRIVED"];
const DISPUTABLE_STATUSES: BookingStatus[] = ["IN_PROGRESS", "COMPLETED"];
const CANCELLED_STATUSES: BookingStatus[] = ["CANCELLED_BY_CLIENT", "CANCELLED_BY_PARTNER", "CANCELLED_BY_ADMIN"];

const STEPS: { key: BookingStatus; label: string }[] = [
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PARTNER_EN_ROUTE", label: "On the way" },
  { key: "PARTNER_ARRIVED", label: "Arrived" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
];

// CONFIRMED is a scheduled booking's equivalent of ACCEPTED (see
// BookingsPanel's own accept branch) — folded into the same first step so
// scheduled and on-demand bookings share one timeline. Anything else
// (cancelled, disputed, or a pre-accept status reached via a stale link)
// falls outside the happy-path timeline entirely — StatusBanner covers
// those instead.
function stepIndexFor(status: BookingStatus): number {
  if (status === "CONFIRMED") return 0;
  return STEPS.findIndex((s) => s.key === status);
}

// scheduledDate is a real DateTime column on the backend, so it comes back
// as a full ISO instant rather than a plain "YYYY-MM-DD" string — same fix
// AvailabilityPanel/TodayActivity/BookingsPanel already needed.
function formatScheduledDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

function StatusTimeline({ status }: { status: BookingStatus }) {
  const activeIndex = stepIndexFor(status);
  if (activeIndex === -1) return null;

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "current" : "upcoming";
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16 shrink-0">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0 ${
                  state === "done"
                    ? "bg-[#C9851A] border-[#C9851A] text-white"
                    : state === "current"
                    ? "border-[#C9851A] text-[#C9851A] bg-white"
                    : "border-stone-200 text-stone-300 bg-white"
                }`}
              >
                {state === "done" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${state === "current" ? "bg-[#C9851A] animate-pulse" : "bg-stone-200"}`}
                  />
                )}
              </span>
              <span
                className={`text-[10px] font-bold text-center leading-tight ${
                  state === "upcoming" ? "text-stone-350" : "text-stone-700"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-3 ${i < activeIndex ? "bg-[#C9851A]" : "bg-stone-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Content for every status (or overdue state) that leaves nothing for the
// partner to do here — StatusBanner below just picks one and renders it.
// Falls back to a generic label for anything not called out explicitly.
function bannerContent(status: BookingStatus, isMissed: boolean) {
  if (isMissed) {
    return {
      icon: <CalendarX className="h-4.5 w-4.5" />,
      iconWrap: "bg-white text-red-600",
      border: "border-red-100",
      bg: "bg-red-50",
      title: "Expired",
      subtitle: "Its scheduled time has passed — you no longer have access to act on it.",
      titleColor: "text-red-800",
      subtitleColor: "text-red-700",
    };
  }
  if (CANCELLED_STATUSES.includes(status)) {
    return {
      icon: <XCircle className="h-4.5 w-4.5" />,
      iconWrap: "bg-stone-100 text-stone-500",
      border: "border-stone-200",
      bg: "bg-stone-50",
      title: "Booking cancelled",
      subtitle: "There's nothing left to do here.",
      titleColor: "text-stone-700",
      subtitleColor: "text-stone-450",
    };
  }
  if (status === "DISPUTED") {
    return {
      icon: <AlertTriangle className="h-4.5 w-4.5" />,
      iconWrap: "bg-white text-amber-600",
      border: "border-amber-100",
      bg: "bg-amber-50",
      title: "Under review",
      subtitle: "Our team is looking into this booking.",
      titleColor: "text-amber-800",
      subtitleColor: "text-amber-700",
    };
  }
  if (status === "NO_PARTNER_FOUND" || status === "EXPIRED") {
    return {
      icon: <UserX className="h-4.5 w-4.5" />,
      iconWrap: "bg-white text-red-600",
      border: "border-red-100",
      bg: "bg-red-50",
      title: "No longer available",
      subtitle:
        status === "NO_PARTNER_FOUND"
          ? "This booking may have already gone to another partner."
          : "This booking expired before it was confirmed.",
      titleColor: "text-red-800",
      subtitleColor: "text-red-700",
    };
  }
  if (status === "PENDING_RESCHEDULE" || status === "RESCHEDULED") {
    return {
      icon: <Calendar className="h-4.5 w-4.5" />,
      iconWrap: "bg-white text-amber-600",
      border: "border-amber-100",
      bg: "bg-amber-50",
      title: status === "PENDING_RESCHEDULE" ? "Reschedule requested" : "Rescheduled",
      subtitle:
        status === "PENDING_RESCHEDULE"
          ? "The client has asked to change the time — nothing to do until it's confirmed."
          : "This slot moved — check your bookings list for the new time.",
      titleColor: "text-amber-800",
      subtitleColor: "text-amber-700",
    };
  }
  return {
    icon: null,
    iconWrap: "",
    border: "border-stone-200",
    bg: "bg-stone-50",
    title: status.replace(/_/g, " "),
    subtitle: null,
    titleColor: "text-stone-700",
    subtitleColor: "text-stone-450",
  };
}

function StatusBanner({ status, isMissed = false }: { status: BookingStatus; isMissed?: boolean }) {
  const c = bannerContent(status, isMissed);
  return (
    <div className={`flex items-center gap-3 rounded-2xl border ${c.border} ${c.bg} p-4`}>
      {c.icon && (
        <span className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${c.iconWrap}`}>
          {c.icon}
        </span>
      )}
      <div>
        <p className={`text-sm font-bold ${c.titleColor}`}>{c.title}</p>
        {c.subtitle && <p className={`text-xs mt-0.5 ${c.subtitleColor}`}>{c.subtitle}</p>}
      </div>
    </div>
  );
}

function DetailRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-stone-600">
      <span className="text-stone-400 shrink-0">{icon}</span>
      {children}
    </div>
  );
}

/**
 * Full single-booking tracking screen — the "later page" TodayActivity's
 * mini live card and BookingsPanel's list both used to stand in for
 * directly. This is the one place a partner acts on an already-accepted
 * booking (en route / arrived / start / complete / cancel / dispute); the
 * list and the Home mini-card just link in here now instead of duplicating
 * those buttons themselves.
 */
export default function BookingTrackingPage({
  bookingId,
  onBack,
}: {
  bookingId: string;
  onBack: () => void;
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await bookingsApi.getBooking(bookingId);
      setBooking(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this booking.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not a render-loop hazard
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bookingId is the one identity that should ever re-trigger this
  }, [bookingId]);

  // Reload if the backend says this exact booking changed status for a
  // reason that wasn't this partner's own action (see PartnerSocketGateway/
  // PaymentService — cancel/dispute by the client). Every other transition
  // this screen shows is the partner's own action, already reflected
  // locally by runAction below — this is specifically the "changed behind
  // your back" case a live-tracking screen otherwise has no way to learn
  // about short of polling.
  useEffect(
    () =>
      onPartnerSocketEvent("booking:status-changed", (...args) => {
        const payload = args[0] as { bookingId?: string } | undefined;
        if (payload?.bookingId === bookingId) load();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bookingId is the one identity that should ever re-trigger this
    [bookingId],
  );

  const runAction = async (key: string, fn: () => Promise<Booking>) => {
    setBusyAction(key);
    setError(null);
    try {
      const updated = await fn();
      setBooking(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't go through — please try again.");
    } finally {
      setBusyAction(null);
    }
  };

  if (!booking && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
      </div>
    );
  }

  const Header = (
    <div className="px-5 pt-6 pb-4 flex items-center gap-3">
      <button
        onClick={onBack}
        className="w-10 h-10 border border-stone-200 rounded-2xl flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 shrink-0"
      >
        <ArrowLeft className="w-5 h-5 text-stone-700" />
      </button>
      <h1 className="text-lg font-extrabold text-stone-900">Track booking</h1>
    </div>
  );

  if (!booking) {
    return (
      <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
        {Header}
        <div className="px-5">
          <p className="text-sm font-medium text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const serviceNames = booking.items?.map((item) => item.serviceItemName).join(", ") || "Service booking";
  const mapsUrl =
    booking.address?.latitude != null && booking.address?.longitude != null
      ? `https://www.google.com/maps?q=${booking.address.latitude},${booking.address.longitude}`
      : null;
  const addressLine = [booking.address?.city, booking.address?.pincode].filter(Boolean).join(" · ");

  // Mirrors BookingsPanel's own "Missed" tag — the backend never
  // auto-transitions a booking out of a pre-start status once its slot
  // passes, so this has to be caught here too rather than trusting the raw
  // status to still mean "actionable". Once missed, nothing below (timeline,
  // primary action, cancel/dispute) should still offer to act on it.
  const isMissed = isBookingOverdue(booking);
  const isCancellable = !isMissed && CANCELLABLE_STATUSES.includes(booking.status);
  const isDisputable = !isMissed && DISPUTABLE_STATUSES.includes(booking.status);
  const onHappyPath = !isMissed && stepIndexFor(booking.status) !== -1;

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28 lg:pb-10">
      {Header}

      <div className="px-5 max-w-lg w-full mx-auto flex flex-col gap-4">
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        {onHappyPath ? (
          <div className="rounded-2xl border border-stone-100 bg-white shadow-sm p-5">
            <StatusTimeline status={booking.status} />
          </div>
        ) : (
          <StatusBanner status={booking.status} isMissed={isMissed} />
        )}

        <div className="rounded-2xl border border-stone-100 bg-[#FAF9F6] p-4 space-y-3">
          <p className="text-sm font-extrabold text-stone-900">{serviceNames}</p>
          <DetailRow icon={<Calendar className="h-4 w-4" />}>
            {formatScheduledDate(booking.scheduledDate)}
          </DetailRow>
          <DetailRow icon={<Clock className="h-4 w-4" />}>
            {booking.scheduledTime} · {booking.estimatedDurationMinutes} min
          </DetailRow>
          {addressLine && (
            <DetailRow icon={<MapPin className="h-4 w-4" />}>
              <span className="flex-1">{addressLine}</span>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-bold text-[#C9851A] hover:underline shrink-0"
                >
                  <ExternalLink className="h-3 w-3" /> Map
                </a>
              )}
            </DetailRow>
          )}
          {booking.clientNotes && (
            <DetailRow icon={<StickyNote className="h-4 w-4" />}>
              <span className="italic">&ldquo;{booking.clientNotes}&rdquo;</span>
            </DetailRow>
          )}
          <DetailRow icon={<IndianRupee className="h-4 w-4" />}>
            <span className="font-bold text-stone-900">₹{booking.partnerEarning.toFixed(0)}</span>
            <span className="text-stone-400 ml-1">you earn</span>
          </DetailRow>
        </div>

        {booking.status === "COMPLETED" && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-green-600 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-green-800">Service completed</p>
              <p className="text-xs text-green-700 mt-0.5">Nice work — this one&apos;s done.</p>
            </div>
          </div>
        )}

        {/* Primary action — the one step this booking is actually waiting on.
            Suppressed once the slot's passed (isMissed) — see StatusBanner
            above, which already tells the partner why there's nothing here. */}
        {isMissed ? null : booking.status === "ACCEPTED" || booking.status === "CONFIRMED" ? (
          <button
            onClick={() => runAction("en-route", () => bookingsApi.markEnRoute(booking.id))}
            disabled={busyAction !== null}
            className="w-full rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busyAction === "en-route" && <Loader2 className="h-4 w-4 animate-spin" />}
            On my way
          </button>
        ) : booking.status === "PARTNER_EN_ROUTE" ? (
          <button
            onClick={() => runAction("arrived", () => bookingsApi.markArrived(booking.id))}
            disabled={busyAction !== null}
            className="w-full rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busyAction === "arrived" && <Loader2 className="h-4 w-4 animate-spin" />}
            I&apos;ve arrived
          </button>
        ) : booking.status === "PARTNER_ARRIVED" ? (
          <StartServiceModal
            bookingId={booking.id}
            onStarted={load}
            trigger={(open) => (
              <button
                onClick={open}
                disabled={busyAction !== null}
                className="w-full rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                Enter code to start
              </button>
            )}
          />
        ) : booking.status === "IN_PROGRESS" ? (
          <button
            onClick={() => runAction("complete", () => bookingsApi.completeBooking(booking.id))}
            disabled={busyAction !== null}
            className="w-full rounded-xl py-3 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busyAction === "complete" && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark complete
          </button>
        ) : null}

        {/* Secondary actions — only ever shown when the call behind them
            would actually succeed (see the gating arrays up top). */}
        {(isCancellable || isDisputable) && (
          <div className="flex gap-2">
            {isCancellable && (
              <CancelBookingModal
                bookingId={booking.id}
                onCancelled={onBack}
                trigger={(open) => (
                  <button
                    onClick={open}
                    disabled={busyAction !== null}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-60"
                  >
                    Cancel booking
                  </button>
                )}
              />
            )}
            {isDisputable && (
              <DisputeBookingModal
                bookingId={booking.id}
                onDisputed={load}
                trigger={(open) => (
                  <button
                    onClick={open}
                    disabled={busyAction !== null}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all cursor-pointer disabled:opacity-60"
                  >
                    Report an issue
                  </button>
                )}
              />
            )}
          </div>
        )}

        {booking.status === "COMPLETED" && (
          <button
            onClick={onBack}
            className="w-full rounded-xl py-3 text-sm font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all cursor-pointer"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
