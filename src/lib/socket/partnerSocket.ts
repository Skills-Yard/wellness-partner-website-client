import { io, type Socket } from "socket.io-client";
import { ApiError, getAccessToken } from "@/lib/api/client";

/**
 * Fast path alongside the existing REST API: a persistent connection to the
 * backend's `/partner` Socket.IO namespace lets job offers and booking
 * actions travel with sub-second latency while this tab is open, instead of
 * waiting on the next poll tick or a push notification's variable delivery
 * time. REST (via lib/api/bookings.ts) stays the fallback whenever this
 * isn't connected — see emitWithAck below.
 */

/** Thrown when an emit never gets an ack — the socket disconnected mid-call
 *  or the backend didn't respond in time. Distinct from ApiError (a real
 *  answer from the backend) so callers know to retry over REST instead of
 *  surfacing a false business error. */
export class SocketTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocketTransportError";
  }
}

type WsAckResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

// The backend's PartnerSocketGateway.respond() puts the thrown Nest
// exception's class name in error.code — map the common ones back to the
// HTTP status REST would have returned, so status-based checks already in
// this codebase (e.g. IncomingBookingModal's `err.status === 409` race-loss
// handling) behave identically regardless of which transport answered.
const STATUS_BY_CODE: Record<string, number> = {
  BadRequestException: 400,
  UnauthorizedException: 401,
  ForbiddenException: 403,
  NotFoundException: 404,
  ConflictException: 409,
};

function statusForCode(code?: string): number {
  return (code ? STATUS_BY_CODE[code] : undefined) ?? 500;
}

function getSocketOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  // Defensive against the current .env value being several candidate URLs
  // concatenated with "#" — takes the first one rather than hard-failing.
  const candidate = raw.split("#").find((part) => part.trim().length > 0);
  if (!candidate) return null;
  try {
    // The gateway's namespace lives at the app root — setGlobalPrefix('api')
    // and URI versioning in the backend's main.ts only apply to its HTTP
    // routing, not to Socket.IO's own path/namespace — so only the origin
    // (protocol + host + port) is relevant here, not the API path.
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

let socket: Socket | null = null;

export function connectPartnerSocket(): void {
  if (socket?.connected) return;

  if (socket) {
    socket.connect();
    return;
  }

  const origin = getSocketOrigin();
  if (!origin) {
    console.error(
      "Could not derive a Socket.IO origin from NEXT_PUBLIC_API_URL — realtime dispatch will fall back to REST/polling only.",
    );
    return;
  }

  socket = io(`${origin}/partner`, {
    autoConnect: false,
    // A function, not a static object: re-read on every (re)connection
    // attempt so a token rotated mid-session (or refreshed after this
    // module first loaded) is picked up rather than a stale closed-over one.
    auth: (cb) => cb({ token: getAccessToken() }),
  });
  socket.connect();
}

export function disconnectPartnerSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function isPartnerSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/** Subscribes a handler to a server-pushed event (e.g. booking:offer). Only
 *  meaningful once connectPartnerSocket() has run — returns a no-op cleanup
 *  if there's no socket instance yet. */
export function onPartnerSocketEvent(
  event: string,
  handler: (...args: unknown[]) => void,
): () => void {
  if (!socket) return () => {};
  socket.on(event, handler);
  const current = socket;
  return () => current.off(event, handler);
}

export function emitWithAck<T>(
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  if (!socket?.connected) {
    return Promise.reject(new SocketTransportError("Not connected."));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new SocketTransportError(`Timed out waiting for ack on "${event}".`));
    }, timeoutMs);

    socket!.emit(event, payload, (ack: WsAckResponse<T>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (ack.ok) {
        resolve(ack.data);
      } else {
        reject(
          new ApiError(
            ack.error.message,
            ack.error.code ?? "SOCKET_ERROR",
            statusForCode(ack.error.code),
          ),
        );
      }
    });
  });
}
