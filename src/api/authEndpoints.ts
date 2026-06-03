import { apiPost, authedGet, authedSend } from "./client";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from "./types";

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/register", body);
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", body);
}

export function logout(refreshToken: string, everywhere: boolean): Promise<void> {
  if (everywhere) {
    return authedSend<void>("/api/auth/logout?all=true", "POST", { refreshToken });
  }
  return apiPost<void>("/api/auth/logout", { refreshToken });
}

export function verifyEmail(token: string): Promise<void> {
  return apiPost<void>("/api/auth/verify", { token });
}

export function resendVerification(): Promise<void> {
  return authedSend<void>("/api/auth/resend-verification", "POST");
}

export function requestPasswordReset(email: string): Promise<void> {
  return apiPost<void>("/api/auth/password/reset-request", { email });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiPost<void>("/api/auth/password/reset", { token, newPassword });
}

export function getMe(): Promise<AuthUser> {
  return authedGet<AuthUser>("/api/users/me");
}

export function patchMe(body: UpdateProfileRequest): Promise<AuthUser> {
  return authedSend<AuthUser>("/api/users/me", "PATCH", body);
}
