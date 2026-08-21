import { request } from "./client";
import type { NotificationItem, RegisterDeviceTokenBody } from "./types";

export function getNotifications(params?: { isRead?: boolean; take?: number; skip?: number }) {
  const query = new URLSearchParams();
  if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
  if (params?.take !== undefined) query.set("take", String(params.take));
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  const qs = query.toString();

  return request<NotificationItem[]>(`/partner/notifications${qs ? `?${qs}` : ""}`);
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
