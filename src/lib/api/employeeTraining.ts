import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
  EmployeeTrainingProgress,
  TrainingStatus,
} from "./types";
import { ApiError } from "./client";

/**
 * Public, token-only client for the /employee-training/[token] page. It
 * deliberately does NOT go through ./client (no Authorization header, no
 * silent-refresh, no partner session) — the signed token in the URL is the
 * whole credential, and the person opening the link has no account.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface EmployeeTrainingView {
  employee: { name: string; status: string };
  readOnly: boolean;
  courses: EmployeeTrainingProgress[];
}

export interface EmployeeTrainingUpdateResult {
  updated: boolean;
  readOnly: boolean;
  approved?: boolean;
  message?: string;
  courses: EmployeeTrainingProgress[];
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-client-platform": "WEB",
        "ngrok-skip-browser-warning": "true",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      "NETWORK_ERROR",
      0
    );
  }

  const json = (res.status === 204 ? null : await res.json().catch(() => null)) as
    | ApiSuccessEnvelope<T>
    | ApiErrorEnvelope
    | null;

  if (!res.ok || !json || json.success === false) {
    const err = json && json.success === false ? json.error : undefined;
    throw new ApiError(
      err?.message ?? "This training link is no longer valid.",
      err?.code ?? "REQUEST_FAILED",
      res.status
    );
  }
  return json.data;
}

export function getEmployeeTrainingByToken(token: string) {
  return call<EmployeeTrainingView>(`/employee-training/${encodeURIComponent(token)}`);
}

export function updateEmployeeTrainingByToken(
  token: string,
  courseId: string,
  status: TrainingStatus,
  score?: number
) {
  return call<EmployeeTrainingUpdateResult>(
    `/employee-training/${encodeURIComponent(token)}/courses/${courseId}/status`,
    { method: "PATCH", body: JSON.stringify({ status, score }) }
  );
}
