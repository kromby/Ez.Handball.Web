import { afterEach, expect, test, vi } from "vitest";
import * as auth from "./authEndpoints";
import * as client from "./client";

afterEach(() => vi.restoreAllMocks());

function spyPost() {
  return vi.spyOn(client, "apiPost").mockResolvedValue({} as never);
}
function spySend() {
  return vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
}
function spyAuthedGet() {
  return vi.spyOn(client, "authedGet").mockResolvedValue({} as never);
}

test("register posts to /api/auth/register", async () => {
  const spy = spyPost();
  const body = {
    email: "a@b.is",
    password: "hunter2hunter2",
    displayName: "Jon",
    language: "is" as const,
    favoriteClubId: "385",
  };
  await auth.register(body);
  expect(spy).toHaveBeenCalledWith("/api/auth/register", body);
});

test("login posts to /api/auth/login", async () => {
  const spy = spyPost();
  await auth.login({ email: "a@b.is", password: "x" });
  expect(spy).toHaveBeenCalledWith("/api/auth/login", { email: "a@b.is", password: "x" });
});

test("logout single posts the refresh token unauthenticated", async () => {
  const spy = spyPost();
  await auth.logout("refresh-1", false);
  expect(spy).toHaveBeenCalledWith("/api/auth/logout", { refreshToken: "refresh-1" });
});

test("logout everywhere uses an authed send with the all flag", async () => {
  const spy = spySend();
  await auth.logout("refresh-1", true);
  expect(spy).toHaveBeenCalledWith("/api/auth/logout?all=true", "POST", { refreshToken: "refresh-1" });
});

test("verifyEmail posts the token", async () => {
  const spy = spyPost();
  await auth.verifyEmail("tok");
  expect(spy).toHaveBeenCalledWith("/api/auth/verify", { token: "tok" });
});

test("resendVerification authed-posts with no body", async () => {
  const spy = spySend();
  await auth.resendVerification();
  expect(spy).toHaveBeenCalledWith("/api/auth/resend-verification", "POST");
});

test("requestPasswordReset posts the email", async () => {
  const spy = spyPost();
  await auth.requestPasswordReset("a@b.is");
  expect(spy).toHaveBeenCalledWith("/api/auth/password/reset-request", { email: "a@b.is" });
});

test("resetPassword posts token and new password", async () => {
  const spy = spyPost();
  await auth.resetPassword("tok", "newpassword123");
  expect(spy).toHaveBeenCalledWith("/api/auth/password/reset", {
    token: "tok",
    newPassword: "newpassword123",
  });
});

test("getMe authed-gets /api/users/me", async () => {
  const spy = spyAuthedGet();
  await auth.getMe();
  expect(spy).toHaveBeenCalledWith("/api/users/me");
});

test("patchMe authed-patches /api/users/me", async () => {
  const spy = spySend();
  await auth.patchMe({ displayName: "New" });
  expect(spy).toHaveBeenCalledWith("/api/users/me", "PATCH", { displayName: "New" });
});
