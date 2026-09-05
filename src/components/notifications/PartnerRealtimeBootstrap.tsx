"use client";

import { usePartnerRealtimeConnection } from "@/hooks/usePartnerRealtimeConnection";

/** Mounted once near the app root while logged in, alongside
 *  PushNotificationBootstrap — renders nothing, just keeps the realtime
 *  socket connection alive. See usePartnerRealtimeConnection. */
export default function PartnerRealtimeBootstrap({ enabled }: { enabled: boolean }) {
  usePartnerRealtimeConnection(enabled);
  return null;
}
