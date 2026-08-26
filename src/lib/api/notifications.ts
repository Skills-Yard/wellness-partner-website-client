import { request, requestEnvelope } from "./client";
import type { NotificationItem, RegisterDeviceTokenBody } from "./types";

// Was `request()` (returns bare `.data`) — the backend now returns
// `{ data, pagination, counts: { unread, read } }` instead of a plain array,
// so this needs the full envelope (requestEnvelope) to reach `pagination`/
// `counts` at all. See useNotifications for how callers consume it.
export function getNotifications(params?: { isRead?: boolean; take?: number; skip?: number }) {
  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.take !== undefined) query.set("take", String(params.take));
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  const qs = query.toString();

  return requestEnvelope<NotificationItem[]>(`/partner/notifications${qs ? `?${qs}` : ""}`);
}

export function getUnreadNotificationCount() {
  return request<{ count: number }>("/partner/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return request<{ success: boolean }>(`/partner/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead() {
  return request<{ updated: number }>("/partner/notifications/read-all", { method: "PATCH" });
}

/**
 * Confirms this device actually received the push — distinct from marking it
 * read, which is about the partner's attention rather than delivery. The
 * backend treats silence as a missed push and escalates to SMS, so this is
 * what stands the ladder down. Prefer acknowledgeDelivery() in
 * lib/notifications/deliveryAck.ts, which dedupes and never throws.
 */
export function acknowledgeNotificationDelivery(id: string) {
  return request<{ success: boolean; firstReceipt: boolean }>(
    `/partner/notifications/${id}/delivered`,
    { method: "POST" }
  );
}

export function registerDeviceToken(body: RegisterDeviceTokenBody) {
  return request<{ id: string }>("/partner/notifications/device-token", {
    method: "POST",
    body,
  });
}

export function unregisterDeviceToken(fcmToken: string) {
  return request<{ success: boolean }>("/partner/notifications/device-token", {
    method: "DELETE",
    body: { fcmToken },
  });
}
