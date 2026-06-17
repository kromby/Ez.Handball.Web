import { createContext, useContext } from "react";
import type { AuthUser, RegisterRequest, UpdateProfileRequest } from "../api/types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterRequest) => Promise<void>;
  logout: (everywhere?: boolean) => Promise<void>;
  updateProfile: (input: UpdateProfileRequest) => Promise<void>;
  resendVerification: () => Promise<void>;
  setTeamName: (name: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
}
