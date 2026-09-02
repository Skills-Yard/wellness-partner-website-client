"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as employeesApi from "@/lib/api/employees";
import { getAccessToken } from "@/lib/api/client";
import { queryKeys } from "./queryKeys";

/**
 * Team management for BUSINESS partners — list + per-employee KYC + the
 * create/update/remove/submit-KYC mutations, all funnelling through one
 * `["employees"]` cache so any change re-renders TeamPanel without manual
 * refetch plumbing. Only ever enabled for an approved business partner
 * (TeamPanel is unreachable otherwise).
 */
export function useEmployees(enabled: boolean) {
  const accessToken = typeof window !== "undefined" ? getAccessToken() : null;

  return useQuery({
    queryKey: queryKeys.employees(),
    queryFn: () => employeesApi.getEmployees(),
    enabled: enabled && !!accessToken,
    staleTime: 30 * 1000,
  });
}

/**
 * One employee's KYC record. The endpoint 404s when nothing's been
 * submitted, so `retry: false` and callers read `isError` as "not submitted
 * yet" rather than a real failure.
 */
export function useEmployeeKyc(employeeId: string | null) {
  return useQuery({
    queryKey: queryKeys.employeeKyc(employeeId ?? "none"),
    queryFn: () => employeesApi.getEmployeeKyc(employeeId as string),
    enabled: !!employeeId,
    retry: false,
    staleTime: 30 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof employeesApi.createEmployee>[0]) =>
      employeesApi.createEmployee(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees() }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof employeesApi.updateEmployee>[1];
    }) => employeesApi.updateEmployee(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees() }),
  });
}

export function useRemoveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.removeEmployee(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees() }),
  });
}

export function useSubmitEmployeeKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: employeesApi.SubmitEmployeeKycPayload }) =>
      employeesApi.submitEmployeeKyc(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeKyc(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

/**
 * One employee's assigned training courses + progress (owner-proxy view).
 * Only meaningful once the employee's KYC is approved (status TRAINING or
 * beyond); callers gate `enabled` on that.
 */
export function useEmployeeTraining(employeeId: string | null) {
  return useQuery({
    queryKey: queryKeys.employeeTraining(employeeId ?? "none"),
    queryFn: () => employeesApi.getEmployeeTraining(employeeId as string),
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateEmployeeCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      courseId,
      status,
      score,
    }: {
      id: string;
      courseId: string;
      status: Parameters<typeof employeesApi.updateEmployeeCourseStatus>[2];
      score?: number;
    }) => employeesApi.updateEmployeeCourseStatus(id, courseId, status, score),
    onSuccess: (_result, { id }) => {
      // Completing the last mandatory course auto-approves the employee, so
      // refresh both the training list and the employee row's status badge.
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeTraining(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

export function useMarkEmployeeLesson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      courseId,
      lessonId,
    }: {
      id: string;
      courseId: string;
      lessonId: string;
    }) => employeesApi.markEmployeeLesson(id, courseId, lessonId),
    onSuccess: (_result, { id }) => {
      // Completing a course's last lesson auto-approves the employee, so
      // refresh both the training list and the employee row's status badge.
      queryClient.invalidateQueries({ queryKey: queryKeys.employeeTraining(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees() });
    },
  });
}

export function useCreateEmployeeTrainingLink() {
  return useMutation({
    mutationFn: (id: string) => employeesApi.createEmployeeTrainingLink(id),
  });
}
