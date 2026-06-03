import { useEffect, useRef, useState, type ReactNode } from "react";
import * as auth from "../api/authEndpoints";
import type { AuthUser, RegisterRequest, UpdateProfileRequest } from "../api/types";
import { AuthContext, type AuthStatus } from "./useAuth";
import * as store from "./tokenStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    store.onSessionCleared(() => {
      setUser(null);
      setStatus("anonymous");
    });
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    async function bootstrap() {
      if (!store.getRefreshToken()) {
        setStatus("anonymous");
        return;
      }
      const refreshed = await store.refresh();
      if (!refreshed) {
        setStatus("anonymous");
        return;
      }
      try {
        setUser(await auth.getMe());
        setStatus("authenticated");
      } catch {
        store.expireSession();
      }
    }
    void bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const res = await auth.login({ email, password });
    store.setSession(res);
    setUser(res.user);
    setStatus("authenticated");
  }

  async function register(input: RegisterRequest) {
    const res = await auth.register(input);
    store.setSession(res);
    setUser(res.user);
    setStatus("authenticated");
  }

  async function logout(everywhere = false) {
    const refreshToken = store.getRefreshToken();
    try {
      if (refreshToken) await auth.logout(refreshToken, everywhere);
    } catch {
      // best-effort: clear locally even if the server call fails
    } finally {
      store.clearSession();
      setUser(null);
      setStatus("anonymous");
    }
  }

  async function updateProfile(input: UpdateProfileRequest) {
    setUser(await auth.patchMe(input));
  }

  async function resendVerification() {
    await auth.resendVerification();
  }

  return (
    <AuthContext.Provider
      value={{ status, user, login, register, logout, updateProfile, resendVerification }}
    >
      {children}
    </AuthContext.Provider>
  );
}
