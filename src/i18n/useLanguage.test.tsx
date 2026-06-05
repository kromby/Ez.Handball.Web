import { act, render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "./index";
import { useLanguage, useLanguageSync } from "./useLanguage";
import { AuthContext } from "../auth/useAuth";
import { buildAuth } from "../test/renderWithQuery";
import { readStoredLanguage } from "./languageStorage";
import type { AuthUser } from "../api/types";

const user = (language: "is" | "en"): AuthUser => ({
  id: "u1", email: "a@b.is", displayName: "Jon", language,
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
});

function wrap(authOverrides = {}) {
  const value = buildAuth(authOverrides);
  return {
    value,
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={i18n}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </I18nextProvider>
    ),
  };
}

afterEach(() => { localStorage.clear(); i18n.changeLanguage("en"); });

describe("useLanguageSync", () => {
  test("adopts the authenticated user's language", async () => {
    const { wrapper } = wrap({ status: "authenticated", user: user("is") });
    function Probe() { useLanguageSync(); return null; }
    render(<Probe />, { wrapper });
    await waitFor(() => expect(i18n.language).toBe("is"));
    expect(document.documentElement.lang).toBe("is");
  });
});

describe("useLanguage", () => {
  test("anonymous setLanguage changes language and persists to storage", async () => {
    const { wrapper } = wrap({ status: "anonymous" });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => { await result.current.setLanguage("is"); });
    expect(i18n.language).toBe("is");
    expect(readStoredLanguage()).toBe("is");
  });

  test("authenticated setLanguage also saves to the account", async () => {
    const updateProfile = vi.fn().mockResolvedValue(undefined);
    const { wrapper } = wrap({ status: "authenticated", user: user("en"), updateProfile });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => { await result.current.setLanguage("is"); });
    expect(updateProfile).toHaveBeenCalledWith({ language: "is" });
  });

  test("setLanguage keeps <html lang> in sync (via languageChanged)", async () => {
    const { wrapper } = wrap({ status: "anonymous" });
    // Mount the sync hook so the languageChanged listener is active, plus the toggle hook.
    const { result } = renderHook(() => { useLanguageSync(); return useLanguage(); }, { wrapper });
    await act(async () => { await result.current.setLanguage("is"); });
    expect(document.documentElement.lang).toBe("is");
  });
});
