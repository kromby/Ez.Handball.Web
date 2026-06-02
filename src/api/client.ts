import { baseUrl } from "./config";
import { expireSession, getAccessToken, refresh } from "../auth/tokenStore";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | null,
    message: string,
    public readonly details?: { field?: string },
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function toError(res: Response): Promise<ApiError> {
  let code: string | null = null;
  let details: { field?: string } | undefined;
  try {
    const body = (await readJson<{ error?: unknown; details?: { field?: string } }>(res)) ?? {};
    code = typeof body.error === "string" ? body.error : null;
    if (body.details && typeof body.details === "object") details = body.details;
  } catch {
    code = null;
  }
  return new ApiError(res.status, code, `HTTP ${res.status}${code ? ` (${code})` : ""}`, details);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw await toError(res);
  return readJson<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res);
  return readJson<T>(res);
}

function withAuth(init: RequestInit): RequestInit {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * Sends an authenticated request. On 401 it refreshes once and retries a single
 * time; if refresh fails or the retry still 401s, it ends the session and the
 * caller gets the failing response (mapped to ApiError by authedGet/authedSend).
 */
async function authedFetch(path: string, init: RequestInit): Promise<Response> {
  let res = await fetch(`${baseUrl}${path}`, withAuth(init));
  if (res.status !== 401) return res;

  const refreshed = await refresh();
  if (!refreshed) return res; // expireSession already fired inside refresh()

  res = await fetch(`${baseUrl}${path}`, withAuth(init));
  if (res.status === 401) expireSession();
  return res;
}

export async function authedGet<T>(path: string): Promise<T> {
  const res = await authedFetch(path, { method: "GET" });
  if (!res.ok) throw await toError(res);
  return readJson<T>(res);
}

export async function authedSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const hasBody = body !== undefined;
  const res = await authedFetch(path, {
    method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await toError(res);
  return readJson<T>(res);
}
