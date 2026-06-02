import { baseUrl } from "../api/config";
import type { AuthResponse } from "../api/types";

const REFRESH_KEY = "ezhb.refreshToken";

let accessToken: string | null = null;
let inFlight: Promise<boolean> | null = null;
let sessionClearedHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setSession(session: { accessToken: string; refreshToken: string }): void {
  accessToken = session.accessToken;
  localStorage.setItem(REFRESH_KEY, session.refreshToken);
}

/** Silent clear — used by explicit logout, which updates provider state itself. */
export function clearSession(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_KEY);
}

/** Clear and notify — used when a session ends involuntarily (failed/expired refresh). */
export function expireSession(): void {
  clearSession();
  sessionClearedHandler?.();
}

export function onSessionCleared(handler: () => void): void {
  sessionClearedHandler = handler;
}

/** Single-flight: concurrent callers share one in-flight refresh request. */
export function refresh(): Promise<boolean> {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    expireSession();
    return false;
  }
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      expireSession();
      return false;
    }
    const body = JSON.parse(await res.text()) as AuthResponse;
    setSession({ accessToken: body.accessToken, refreshToken: body.refreshToken });
    return true;
  } catch {
    expireSession();
    return false;
  }
}
