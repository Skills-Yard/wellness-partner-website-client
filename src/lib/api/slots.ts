import { request, fetchAllPaginated } from "./client";
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

// The backend now paginates GET /partner/slots (default 20/page) — this
// used to be a plain single-page request(), which meant a partner with more
// slots than one page in the requested date window would silently see an
// incomplete grid. AvailabilityPanel wants every slot in its (bounded,
// typically ~7-day) window, not a browsable list, so this stays a "fetch it
// all" fix via fetchAllPaginated rather than adding Load-more UI here.
export function getSlots(params?: {
  dateFrom?: string;
  dateTo?: string;
  status?: SlotStatus;
  employeeId?: string;
}) {
  return fetchAllPaginated<PartnerSlot>((page, limit) => {
    const qs = new URLSearchParams();
    if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params?.dateTo) qs.set("dateTo", params.dateTo);
    if (params?.status) qs.set("status", params.status);
    if (params?.employeeId) qs.set("employeeId", params.employeeId);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return `/partner/slots?${qs.toString()}`;
  });
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
