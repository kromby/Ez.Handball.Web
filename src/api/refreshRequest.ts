import { baseUrl } from "./config";
import type { AuthResponse } from "./types";

/** POSTs the refresh token to the auth endpoint. Returns the rotated pair, or null on any failure. Uses plain fetch so it never recurses through authedFetch. */
export async function postRefresh(refreshToken: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as AuthResponse) : null;
  } catch {
    return null;
  }
}
