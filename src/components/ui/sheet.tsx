"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Side-anchored variant of Dialog (see dialog.tsx) — same Radix root/portal/
// overlay/close primitives, just a differently-positioned + differently-
// animated Content. Built for NotificationsSidebar (slide-in-from-left), but
// takes a `side` so a future right-anchored sheet doesn't need its own file.

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs",
        // Same duration as SheetContent's close in both directions (see
        // below) — the backdrop and the panel finishing at the same moment
        // is what reads as one animation instead of two slightly-off ones.
        "data-open:animate-in data-open:fade-in-0 data-open:duration-300",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-250",
        className
      )}
      {...props}
    />
  )
}

const SIDE_CLASSES = {
  left: "inset-y-0 left-0 h-full border-r data-open:slide-in-from-left data-closed:slide-out-to-left",
  right: "inset-y-0 right-0 h-full border-l data-open:slide-in-from-right data-closed:slide-out-to-right",
} as const

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: keyof typeof SIDE_CLASSES
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex min-h-0 flex-col border-stone-100 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] outline-none",
          // Deliberately its own easing (not the ~150ms default the Dialog
          // primitive uses) — a panel this large reads as a snap at that
          // speed; a longer duration + decelerate curve is what makes a
          // slide-in actually feel smooth instead of just fast. Applied
          // unscoped (not data-open:-prefixed) so the close direction gets
          // the same ease-out curve too, instead of easing in one direction
          // and stepping in the other.
          //
          // Interruptible by construction, not by anything special here:
          // tw-animate-css's `enter`/`exit` keyframes each define only one
          // endpoint (enter's `from`, exit's `to`), so the browser fills in
          // the other end from whatever the panel's current computed
          // transform/opacity actually is. Reopening mid-close (or vice
          // versa) — which just flips data-open/data-closed, see Radix's
          // Presence — picks up from exactly where the panel visually is,
          // never resets to a hardcoded start.
          "[--tw-ease:var(--ease-out)] data-open:animate-in data-open:duration-300 data-closed:animate-out data-closed:duration-250",
          SIDE_CLASSES[side],
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

export { Sheet, SheetPortal, SheetClose, SheetOverlay, SheetContent }
