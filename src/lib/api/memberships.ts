import { request, requestEnvelope } from "./client";
import type { BusinessMembership, BusinessMembershipStatus } from "./types";

/**
 * Business-employee membership.
 *
 * Two mirrored surfaces on the same `BusinessMembership` row:
 *   - `/partner/memberships` — the caller as an *employee*: their inbox of
 *     invitations from businesses and their own outbound join requests.
 *   - `/partner/team` — the caller as a *business*: the join code it shares,
 *     invites it sends, requests it approves, and its roster.
 */

// ---- Employee side ----

export function getMyMemberships() {
  return request<BusinessMembership[]>("/partner/memberships");
}

export function requestToJoinBusiness(data: { businessCode: string; message?: string }) {
  return request<BusinessMembership>("/partner/memberships/requests", {
    method: "POST",
    body: data,
  });
}

export function acceptInvite(membershipId: string) {
  return request<BusinessMembership>(`/partner/memberships/${membershipId}/accept`, {
    method: "POST",
    body: {},
  });
}

export function declineInvite(membershipId: string, reason?: string) {
  return request<BusinessMembership>(`/partner/memberships/${membershipId}/decline`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function leaveBusiness(membershipId: string, reason?: string) {
  return request<BusinessMembership>(`/partner/memberships/${membershipId}/leave`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

// ---- Business side ----

export interface TeamRosterParams {
  status?: BusinessMembershipStatus[];
  page?: number;
  limit?: number;
}

export function getTeam(params: TeamRosterParams = {}) {
  const q = new URLSearchParams();
  if (params.status?.length) q.set("status", params.status.join(","));
  q.set("page", String(params.page ?? 1));
  q.set("limit", String(params.limit ?? 50));
  return requestEnvelope<BusinessMembership[]>(`/partner/team?${q.toString()}`);
}

export function getJoinCode() {
  return request<{ businessCode: string }>("/partner/team/join-code");
}

export function invitePartnerByPhone(data: {
  phone: string;
  countryCode?: string;
  role?: string;
  specializations?: string[];
}) {
  return request<BusinessMembership>("/partner/team/invites", {
    method: "POST",
    body: data,
  });
}

export function createEmployeeAccount(data: {
  name: string;
  phone: string;
  countryCode?: string;
  role?: string;
  specializations?: string[];
}) {
  return request<{ membership: BusinessMembership; accountCreated: boolean }>(
    "/partner/team/accounts",
    { method: "POST", body: data }
  );
}

export function approveJoinRequest(membershipId: string) {
  return request<BusinessMembership>(`/partner/team/${membershipId}/approve`, {
    method: "POST",
    body: {},
  });
}

export function rejectJoinRequest(membershipId: string, reason?: string) {
  return request<BusinessMembership>(`/partner/team/${membershipId}/reject`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function removeMember(membershipId: string, reason?: string) {
  return request<BusinessMembership>(`/partner/team/${membershipId}/remove`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}
