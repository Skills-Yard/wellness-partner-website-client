import { request } from "./client";
import type { DayOfWeek, PartnerAvailability, PartnerSlot, SlotStatus } from "./types";

export function getAvailability() {
  return request<PartnerAvailability[]>("/partner/slots/availability");
}

export function setAvailability(
  schedules: { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isActive: boolean }[]
) {
  return request<PartnerAvailability[]>("/partner/slots/availability", {
    method: "PUT",
    body: { schedules },
  });
}

export function getSlots(params?: {
  dateFrom?: string;
  dateTo?: string;
  status?: SlotStatus;
  employeeId?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  if (params?.status) qs.set("status", params.status);
  if (params?.employeeId) qs.set("employeeId", params.employeeId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<PartnerSlot[]>(`/partner/slots${suffix}`);
}

export function generateSlots(data: {
  dates: string[];
  slots: { startTime: string; endTime: string }[];
  employeeId?: string;
}) {
  return request<PartnerSlot[]>("/partner/slots/bulk", {
    method: "POST",
    body: data,
  });
}

export function updateSlotStatus(slotId: string, status: SlotStatus) {
  return request<PartnerSlot>(`/partner/slots/${slotId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
