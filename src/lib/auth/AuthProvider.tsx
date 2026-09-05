"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { setAccessToken, getAccessToken } from "@/lib/api/client";
import * as authApi from "@/lib/api/auth";
import * as partnerApi from "@/lib/api/partner";
import { unregisterPushToken } from "@/lib/notifications/push";
import { disconnectPartnerSocket } from "@/lib/socket/partnerSocket";
import type { AuthTokens, Partner } from "@/lib/api/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: SessionStatus;
  partner: Partner | null;
  /** Store tokens + (optionally already-known) partner after OTP verify or register, then re-fetch the full profile. */
  login: (tokens: AuthTokens, partner?: Partner) => Promise<void>;
  /** Re-fetch the current partner's profile from the backend (e.g. after KYC submit, status poll, profile edit). */
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [partner, setPartner] = useState<Partner | null>(null);

  const refreshProfile = useCallback(async () => {
    const profile = await partnerApi.getProfile();
    setPartner(profile);
    setStatus("authenticated");
  }, []);

  const login = useCallback(async (tokens: AuthTokens, knownPartner?: Partner) => {
    setAccessToken(tokens.accessToken);
    if (knownPartner) {
      setPartner(knownPartner);
      setStatus("authenticated");
    } else {
      await refreshProfile();
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    // Deactivate this device's FCM token server-side while the access token
    // that authorizes it still exists — a signed-out browser shouldn't keep
    // receiving this partner's pushes.
    await unregisterPushToken();
    // Same reasoning for the realtime socket — a signed-out browser
    // shouldn't keep a live authenticated connection open.
    disconnectPartnerSocket();
    try {
      await authApi.logout();
    } catch {
      // best-effort — proceed to clear local state regardless
    }
    setAccessToken(null);
    setPartner(null);
    setStatus("unauthenticated");
  }, []);

  // On mount: resume a session from either a cached access token or the
  // httpOnly refresh-token cookie. No default-authenticated bypass — if
  // both fail, the app lands on the onboarding phone step.
  useEffect(() => {
    (async () => {
      const cachedToken = getAccessToken();
      try {
        if (cachedToken) {
          await refreshProfile();
          return;
        }
        const tokens = await authApi.refreshSession();
        setAccessToken(tokens.accessToken);
        await refreshProfile();
      } catch (err) {
        setAccessToken(null);
        setPartner(null);
        setStatus("unauthenticated");
        if (!(err instanceof ApiError)) {
          console.error("Unexpected error while resuming session:", err);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ status, partner, login, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
