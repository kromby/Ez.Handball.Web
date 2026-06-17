import * as api from "../api/endpoints";

/**
 * Decides where to land a user right after login/registration.
 * An explicit deep-link target (`from`) always wins. Otherwise an incomplete
 * squad steers the user into the market (`/players`); a complete squad lands home.
 */
export async function resolveLanding(from: string | undefined): Promise<string> {
  if (from) return from;
  try {
    const manager = await api.getManager();
    return manager.onboarding.squadComplete ? "/" : "/players";
  } catch {
    return "/";
  }
}
