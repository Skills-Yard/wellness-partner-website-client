"use client";

import React, { useState } from "react";
import { Bell, CheckCheck, Circle, Loader2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/queries/useNotifications";
import NotificationRow from "./NotificationRow";

const PAGE_SIZE = 20;

type Tab = "all" | "unread";

// Pill segmented-control on mobile (the reference design — full-width,
// icon + label, filled when active) collapsing to a compact underline tab
// on desktop (sm:) — same button, two looks, picked by breakpoint alone so
// there's no JS viewport branching.
function TabButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-full sm:rounded-none px-4 py-2.5 sm:p-0 sm:py-3 text-sm font-bold transition-colors cursor-pointer",
        active
          ? "bg-[#FDF3E7] text-[#C9851A] sm:bg-transparent"
          : "border border-stone-200 text-stone-500 hover:border-stone-300 sm:border-0 sm:text-stone-400 sm:hover:text-stone-600",
      )}
    >
      <Icon className="h-4 w-4 sm:hidden" fill={active ? "currentColor" : "none"} />
      {children}
      {active && <span className="hidden sm:block absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#C9851A]" />}
    </button>
  );
}

/** Shared "nothing (more) to see" illustration — full-size for a genuinely
 *  empty list, compact as an end-of-feed footer once every notification is
 *  loaded (mirrors how a fully-read list still gets this treatment in the
 *  reference design, not just a truly-empty one). */
function AllCaughtUp({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-8" : "px-5 py-16")}>
      <Bell className="mb-3 h-8 w-8 text-[#C9851A]" strokeWidth={1.5} />
      <p className="text-sm font-bold text-stone-700">You&apos;re all caught up!</p>
      <p className="text-xs text-stone-400 mt-1">We&apos;ll notify you when something new arrives.</p>
    </div>
  );
}

function NotificationsBody({ onOpenBooking }: { onOpenBooking: (bookingId: string) => void }) {
  const [tab, setTab] = useState<Tab>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: notifications = [], pagination, counts, isLoading } = useNotifications(
    visibleCount,
    tab === "unread" ? false : undefined,
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // `counts` is the same aggregate regardless of which tab's filter is
  // active (see useNotifications) — safe to read both tab totals off of
  // whichever response happens to be current.
  const unreadCount = counts?.unread ?? 0;
  const allCount = unreadCount + (counts?.read ?? 0);

  const changeTab = (next: Tab) => {
    setTab(next);
    setVisibleCount(PAGE_SIZE);
  };

  // The backend returns a real total (pagination.total) alongside this
  // `take`-limited list — use it directly instead of guessing "a full page
  // probably means there's more" from length vs. requested count.
  const canLoadMore = pagination ? notifications.length < pagination.total : false;

  const markAllReadButton = (
    <button
      onClick={() => markAllRead.mutate()}
      disabled={markAllRead.isPending}
      className="flex items-center gap-1.5 text-xs font-bold text-[#C9851A] hover:underline disabled:opacity-60 shrink-0 cursor-pointer"
    >
      {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      Mark all as read
    </button>
  );

  return (
    <>
      <div className="px-4 sm:px-5 pb-3 sm:pb-0 flex items-center justify-between gap-2 sm:gap-3 sm:border-b sm:border-stone-100 shrink-0">
        <div className="flex flex-1 sm:flex-none items-center gap-2 sm:gap-4">
          <TabButton active={tab === "all"} icon={Bell} onClick={() => changeTab("all")}>
            All<span className="hidden sm:inline"> ({allCount})</span>
          </TabButton>
          <TabButton active={tab === "unread"} icon={Circle} onClick={() => changeTab("unread")}>
            Unread<span className="hidden sm:inline"> ({unreadCount})</span>
          </TabButton>
        </div>
        {unreadCount > 0 && <div className="hidden sm:block">{markAllReadButton}</div>}
      </div>

      {/* Same action, demoted to a small link under the pills on mobile —
          the reference design's pill row has no room to spare for it. */}
      {unreadCount > 0 && (
        <div className="px-4 pb-3 flex justify-end sm:hidden shrink-0">{markAllReadButton}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && <AllCaughtUp />}

        {notifications.length > 0 && (
          <div className="flex flex-col gap-3 p-4 sm:gap-0 sm:p-0">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onOpenBooking={onOpenBooking}
                onRead={(id) => markRead.mutate(id)}
              />
            ))}
          </div>
        )}

        {notifications.length > 0 &&
          !isLoading &&
          (canLoadMore ? (
            <div className="px-4 py-4">
              <button
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="w-full rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Load more
              </button>
            </div>
          ) : (
            <AllCaughtUp compact />
          ))}
      </div>
    </>
  );
}

/**
 * Slide-in-from-right drawer over whatever's already on screen — replaces
 * the old dedicated NotificationsPanel route. Notifications never needed a
 * full page of their own (no deep sub-navigation happens inside the list,
 * unlike Bookings/Availability/etc.), so a page swap was just an extra
 * screen to animate through; this stays an overlay on top of the current
 * view instead.
 *
 * Below `sm` this renders the mobile reference design (pill tabs, card
 * rows); at `sm` and up it's the more compact desktop layout shipped
 * earlier (underline tabs, flush divided list) — see TabButton and
 * NotificationRow for how each piece switches at the breakpoint.
 *
 * NotificationsBody is only mounted while `open` — Radix keeps SheetContent
 * itself around a little longer to finish the close animation, but the body
 * unmounts with the close request rather than lingering, so its tab/
 * pagination state resets to a clean "All" view every time the drawer
 * reopens instead of needing separate reset effects.
 */
export default function NotificationsSidebar({
  open,
  onOpenChange,
  onOpenBooking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** See NotificationRow — opens the Bookings panel for a notification tied to a bookingId. */
  onOpenBooking: (bookingId: string) => void;
}) {
  const handleOpenBooking = (bookingId: string) => {
    onOpenChange(false);
    onOpenBooking(bookingId);
  };

  return (
    // No onInteractOutside override here — Radix's default already calls
    // onOpenChange(false) on an outside click (the dimmed backdrop included),
    // so clicking away closes the drawer with the same animated close as
    // every other dismissal, for free.
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm sm:max-w-md p-0 gap-0">
        <div className="px-4 sm:px-5 pt-5 sm:pt-6 pb-4 flex items-center gap-3 shrink-0">
          {/* Balances the close button below so the title lands dead-center
              on mobile, matching the reference — there's no functional
              button on the left (this drawer isn't a page, so it doesn't
              need its own nav trigger). Desktop keeps the title left-aligned. */}
          <span className="w-9 shrink-0 sm:hidden" aria-hidden />
          <h1 className="flex-1 text-center sm:text-left text-lg font-extrabold text-stone-900">Notifications</h1>
          <SheetClose asChild>
            <button
              className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-sm cursor-pointer hover:bg-stone-50 transition-colors shrink-0"
              aria-label="Close notifications"
            >
              <X className="w-4.5 h-4.5 text-stone-700" />
            </button>
          </SheetClose>
        </div>

        {open && <NotificationsBody onOpenBooking={handleOpenBooking} />}
      </SheetContent>
    </Sheet>
  );
}
