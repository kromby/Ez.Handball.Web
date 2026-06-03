import { postRefresh } from "../api/refreshRequest";

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
  const pair = await postRefresh(refreshToken);
  if (!pair) {
    expireSession();
    return false;
  }
  setSession({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
  return true;
}
