"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as membershipsApi from "@/lib/api/memberships";
import {
  confirmTeamAssignment,
  getPendingTeamConfirmations,
} from "@/lib/api/bookings";
import { getAccessToken } from "@/lib/api/client";
import type { BusinessMembershipStatus } from "@/lib/api/types";
import { queryKeys } from "./queryKeys";

/**
 * Employee-side: the caller's own memberships — pending invitations from
 * businesses, outbound join requests, and the businesses they're currently
 * on the team of. Backs the "Employee of X" banner's detail screen.
 */
export function useMyMemberships(enabled = true) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;
  return useQuery({
    queryKey: queryKeys.memberships(),
    queryFn: () => membershipsApi.getMyMemberships(),
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000,
  });
}

function useInvalidateMemberships() {
  const queryClient = useQueryClient();
  // The profile itself lives in AuthProvider (not react-query), so a screen
  // that shows the "Employee of X" banner should also call
  // `useAuth().refreshProfile()` after an accept/leave — this only refreshes
  // the memberships list.
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.memberships() });
}

export function useRequestToJoinBusiness() {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: (data: Parameters<typeof membershipsApi.requestToJoinBusiness>[0]) =>
      membershipsApi.requestToJoinBusiness(data),
    onSuccess: invalidate,
  });
}

export function useRespondToInvite() {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: ({
      membershipId,
      accept,
      reason,
    }: {
      membershipId: string;
      accept: boolean;
      reason?: string;
    }) =>
      accept
        ? membershipsApi.acceptInvite(membershipId)
        : membershipsApi.declineInvite(membershipId, reason),
    onSuccess: invalidate,
  });
}

export function useLeaveBusiness() {
  const invalidate = useInvalidateMemberships();
  return useMutation({
    mutationFn: ({ membershipId, reason }: { membershipId: string; reason?: string }) =>
      membershipsApi.leaveBusiness(membershipId, reason),
    onSuccess: invalidate,
  });
}

/* -------------------------------------------------------------------------- */
/* Business-side                                                             */
/* -------------------------------------------------------------------------- */

export function useTeam(status?: BusinessMembershipStatus[], enabled = true) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;
  const key = status?.length ? [...status].sort().join(",") : undefined;
  return useQuery({
    queryKey: queryKeys.team(key),
    queryFn: () => membershipsApi.getTeam({ status, limit: 100 }),
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000,
  });
}

export function useJoinCode(enabled = true) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;
  return useQuery({
    queryKey: queryKeys.joinCode(),
    queryFn: () => membershipsApi.getJoinCode(),
    enabled: enabled && !!accessToken,
    staleTime: 5 * 60 * 1000,
  });
}

function useInvalidateTeam() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["team"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
  };
}

export function useInvitePartner() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (data: Parameters<typeof membershipsApi.invitePartnerByPhone>[0]) =>
      membershipsApi.invitePartnerByPhone(data),
    onSuccess: invalidate,
  });
}

export function useCreateEmployeeAccount() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (data: Parameters<typeof membershipsApi.createEmployeeAccount>[0]) =>
      membershipsApi.createEmployeeAccount(data),
    onSuccess: invalidate,
  });
}

export function useRespondToJoinRequest() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({
      membershipId,
      approve,
      reason,
    }: {
      membershipId: string;
      approve: boolean;
      reason?: string;
    }) =>
      approve
        ? membershipsApi.approveJoinRequest(membershipId)
        : membershipsApi.rejectJoinRequest(membershipId, reason),
    onSuccess: invalidate,
  });
}

export function useRemoveMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: ({ membershipId, reason }: { membershipId: string; reason?: string }) =>
      membershipsApi.removeMember(membershipId, reason),
    onSuccess: invalidate,
  });
}

/**
 * Business-side: team members who accepted a broadcasted job and are waiting
 * for the business to confirm the assignment. Polls while any are pending —
 * a job can time out or be auto-confirmed server-side with no push.
 */
export function usePendingTeamConfirmations(enabled = true) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;
  return useQuery({
    queryKey: queryKeys.pendingTeamConfirmations(),
    queryFn: getPendingTeamConfirmations,
    enabled: enabled && !!accessToken,
    staleTime: 5 * 1000,
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? 12 * 1000 : 45 * 1000,
  });
}

export function useConfirmTeamAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      employeePartnerId,
    }: {
      bookingId: string;
      employeePartnerId: string;
    }) => confirmTeamAssignment(bookingId, employeePartnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingTeamConfirmations() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingBookings() });
    },
  });
}
