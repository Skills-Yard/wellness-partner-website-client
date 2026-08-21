"use client";

import { Bell, X } from "lucide-react";
import { usePushRegistration } from "@/hooks/usePushRegistration";

/** Mounted once near the app root while logged in. Runs usePushRegistration's
 *  effects (silent token resync + live foreground-push handling) and renders
 *  the toast stack it produces — see usePushRegistration for why this exists
 *  alongside the OS notification, and for how it defers to
 *  IncomingBookingModal for a still-pending on-demand offer. */
export default function PushNotificationBootstrap({ enabled }: { enabled: boolean }) {
  const { toasts, dismissToast } = usePushRegistration(enabled);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-100 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="animate-in slide-in-from-top-2 fade-in pointer-events-auto flex w-full gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.16)]"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDF3E7] text-[#C9851A]">
            <Bell className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900">{toast.title}</p>
            {toast.body && (
              <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{toast.body}</p>
            )}
          </div>

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 cursor-pointer text-stone-400 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
